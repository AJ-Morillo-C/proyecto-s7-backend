import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterAuthDto } from "./dto/register-auth.dto";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { UsersService } from "../users/users.service";
import { ManagerError } from "./../common/errors/manager.error";
import { OmitPassword } from "../common/types/users/omit-password.user";
import * as bcrypt from "bcrypt";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { MailerService } from "@nestjs-modules/mailer";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService
  ) {}

  async register(
    registerAuthDto: RegisterAuthDto,
    file?: Express.Multer.File
  ): Promise<{ user: OmitPassword; access_token: string; refresh_token: string }> {
    const { name, email, password } = registerAuthDto;
    try {
      const user = await this.usersService.create({ name, email, password }, file);

      const { password: _, ...rest } = user;

      const access_token = this.jwtService.sign(rest, {
        secret: process.env.JWT_SECRET,
      });

      if (!access_token) {
        throw new ManagerError({
          type: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        });
      }

      const refresh_token = crypto.randomBytes(40).toString("hex");
      const refresh_token_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

      await this.usersService.update(user.id, {
        refreshToken: refresh_token,
        refreshTokenExpiresAt: refresh_token_expires_at,
      });

      return { user: rest, access_token, refresh_token };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ManagerError.createSignatureError(message);
    }
  }

  async login(loginAuthDto: LoginAuthDto): Promise<{ user: OmitPassword; access_token: string; refresh_token: string }> {
    const { email, password } = loginAuthDto;
    try {
      const user = await this.usersService.findOneByEmail(email);
      if (!user) {
        throw new ManagerError({
          type: "BAD_REQUEST",
          message: "User not found!",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new ManagerError({
          type: "BAD_REQUEST",
          message: "Credentials not valid!",
        });
      }

      const { password: destructuring, ...rest } = user;

      const access_token = this.jwtService.sign(rest, {
        secret: process.env.JWT_SECRET,
      });
      if (!access_token) {
        throw new ManagerError({
          type: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        });
      }

      const refresh_token = crypto.randomBytes(40).toString("hex");
      const refresh_token_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

      await this.usersService.update(user.id, {
        refreshToken: refresh_token,
        refreshTokenExpiresAt: refresh_token_expires_at,
      });

      return { user: rest, access_token, refresh_token };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ManagerError.createSignatureError(message);
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      const response = await this.usersService.findOne(userId);
      const user = response.data;

      if (!user) {
        throw new ManagerError({
          type: "BAD_REQUEST",
          message: "User not found!",
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ManagerError({
          type: "BAD_REQUEST",
          message: "Current password is incorrect!",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.usersService.update(userId, {
        password: hashedPassword,
      });

      return { message: "Password changed successfully" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ManagerError.createSignatureError(message);
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    try {
      const { email } = forgotPasswordDto;

      const checkLimit = await this.usersService.canRequestPasswordReset(email);
      if (!checkLimit.canRequest) {
        throw new ManagerError({
          type: "TOO_MANY_REQUESTS",
          message: checkLimit.message || "Exceeded request limit",
        });
      }

      const user = await this.usersService.findOneByEmail(email);
      if (!user) {
        return { message: "If an account with that email exists, a reset link has been sent" };
      }

      // Generate secure reset token and expiry time
      const resetToken = crypto.randomBytes(4).toString("hex").toUpperCase();
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await this.usersService.update(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      await this.usersService.incrementResetPasswordAttempts(email);

      const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

      await this.mailerService.sendMail({
        to: email,
        subject: "Password Reset Request",
        template: "password-reset",
        context: {
          name: user.name,
          resetLink: resetUrl,
          resetToken: resetToken,
        },
      });

      return { message: "If an account with that email exists, a reset link has been sent" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ManagerError.createSignatureError(message);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const { token, newPassword } = resetPasswordDto;

      const user = await this.usersService.findOneByResetToken(token);
      if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        throw new ManagerError({
          type: "BAD_REQUEST",
          message: "Invalid or expired token",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await this.usersService.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      return { message: "Password reset successfully" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ManagerError.createSignatureError(message);
    }
  }

  async validateUser(email: string, password: string): Promise<OmitPassword | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    const { password: _, ...userData } = user;
    return userData;
  }

  async verifyToken(token: string): Promise<OmitPassword> {
    try {
      const payload = await this.jwtService.verifyAsync<OmitPassword>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.validateUserById(payload.id);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      return user;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new UnauthorizedException("Invalid token");
      }
      throw new UnauthorizedException("Authentication failed");
    }
  }

  async validateUserById(userId: string): Promise<OmitPassword | null> {
    try {
      const response = await this.usersService.findOne(userId);
      if (!response.data) {
        return null;
      }
      const { password, ...userWithoutPassword } = response.data;
      return userWithoutPassword;
    } catch (error) {
      return null;
    }
  }

  async refresh(token: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const user = await this.usersService.findOneByRefreshToken(token);
      if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
        throw new ManagerError({
          type: "UNAUTHORIZED",
          message: "Invalid or expired refresh token",
        });
      }

      const { password, ...rest } = user;

      const access_token = this.jwtService.sign(rest, {
        secret: process.env.JWT_SECRET,
      });

      const refresh_token = crypto.randomBytes(40).toString("hex");
      const refresh_token_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

      await this.usersService.update(user.id, {
        refreshToken: refresh_token,
        refreshTokenExpiresAt: refresh_token_expires_at,
      });

      return { access_token, refresh_token };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ManagerError.createSignatureError(message);
    }
  }
}
