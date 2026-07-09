import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Req,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterAuthDto } from "./dto/register-auth.dto";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { Request } from "express";
import { PublicAccess } from "./decorators/public.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/user.decorator";
import { OmitPassword } from "../common/types/users/omit-password.user";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @PublicAccess()
  @Post("register")
  @UseInterceptors(FileInterceptor("profilePhoto"))
  async register(@Body() registerAuthDto: RegisterAuthDto, @UploadedFile() file?: Express.Multer.File) {
    return await this.authService.register(registerAuthDto, file);
  }

  @PublicAccess()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @PublicAccess()
  @Post("verify")
  async verify(@Req() req: Request) {
    const token = req.cookies["access-token"] || req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException("Unauthorized");
    }
    return this.authService.verifyToken(token);
  }

  @PublicAccess()
  @Post("refresh")
  async refresh(@Req() req: Request, @Body("refreshToken") bodyRefreshToken?: string) {
    const token = bodyRefreshToken || req.cookies["refresh-token"] || req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException("Refresh token is required");
    }
    return this.authService.refresh(token);
  }

  @Get("profile")
  getProfile(@CurrentUser() user: OmitPassword) {
    return user;
  }

  @Post("change-password")
  async changePassword(@CurrentUser() user: OmitPassword, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @PublicAccess()
  @Post("forgot-password")
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @PublicAccess()
  @Post("reset-password")
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
