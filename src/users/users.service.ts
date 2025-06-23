import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user.entity";
import { Repository, UpdateResult } from "typeorm";
import { ManagerError } from "src/common/errors/manager.error";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { AllApiResponse, OneApiResponse } from "src/common/interfaces/response-api.interface";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(createUserDto: CreateUserDto, file?: Express.Multer.File): Promise<UserEntity> {
    try {
      const existingUser = await this.findOneByEmail(createUserDto.email);
      if (existingUser) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "A user with this email already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const profilePhoto = await this.cloudinaryService.uploadProfilePhoto(file);

      const userData = { ...createUserDto, password: hashedPassword, profilePhoto };

      const user = await this.userRepository.save(userData);
      if (!user) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "user not created!",
        });
      }
      return user;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<AllApiResponse<UserEntity>> {
    const { limit, page } = paginationDto;
    const skip = (page - 1) * limit;
    try {
      const [total, data] = await Promise.all([
        this.userRepository.count({ where: { isActive: true } }),
        this.userRepository.createQueryBuilder("user").where({ isActive: true }).take(limit).skip(skip).getMany(),
      ]);

      const lastPage = Math.ceil(total / limit);

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        meta: {
          page,
          limit,
          lastPage,
          total,
        },
        data,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findOne(id: string): Promise<OneApiResponse<UserEntity>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id, isActive: true },
      });
      if (!user) {
        throw new ManagerError({
          type: "BAD_REQUEST",
          message: "User not found",
        });
      }

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: user,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findOneByEmail(email: string): Promise<UserEntity | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { email, isActive: true },
      });
      return user;
    } catch (error) {
      throw new ManagerError({
        type: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }
  async findAllForUsers(paginationDto: PaginationDto & { search?: string }): Promise<AllApiResponse<UserEntity>> {
    const { limit, page, search } = paginationDto;
    const skip = (page - 1) * limit;

    const query = this.userRepository.createQueryBuilder("user").where("user.isActive = true");

    if (search) {
      query.andWhere("(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)", {
        search: `%${search.toLowerCase()}%`,
      });
    }

    const [data, total] = await Promise.all([query.take(limit).skip(skip).getMany(), query.getCount()]);

    const lastPage = Math.ceil(total / limit);

    return {
      status: {
        statusMsg: "ACCEPTED",
        statusCode: 200,
        error: null,
      },
      meta: {
        page,
        limit,
        lastPage,
        total,
      },
      data,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    try {
      const user = await this.userRepository.update({ id }, updateUserDto);
      if (user.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "user not found!",
        });
      }
      return user;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async remove(id: string): Promise<UpdateResult> {
    try {
      const user = await this.userRepository.update({ id }, { isActive: false });
      if (user.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "user not found!",
        });
      }
      return user;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findOneByResetToken(token: string): Promise<UserEntity | undefined> {
    try {
      const user = await this.userRepository.findOne({
        where: { resetToken: token },
      });
      return user;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async canRequestPasswordReset(email: string): Promise<{ canRequest: boolean; message?: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { canRequest: true };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    if (!user.lastResetPasswordAttempt || user.lastResetPasswordAttempt < oneHourAgo) {
      await this.userRepository.update(user.id, {
        resetPasswordAttempts: 0,
        lastResetPasswordAttempt: now,
      });
      return { canRequest: true };
    }

    if (user.resetPasswordAttempts >= 3) {
      const nextAttemptTime = new Date(user.lastResetPasswordAttempt.getTime() + 3600000);
      const remainingMinutes = Math.ceil((nextAttemptTime.getTime() - now.getTime()) / 60000);

      return {
        canRequest: false,
        message: `You have exceeded the attempt limit. Please wait ${remainingMinutes} minutes.`,
      };
    }

    return { canRequest: true };
  }

  async incrementResetPasswordAttempts(email: string): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        resetPasswordAttempts: () => "resetPasswordAttempts + 1",
        lastResetPasswordAttempt: new Date(),
      })
      .where("email = :email", { email })
      .execute();
  }

  async updateProfilePhoto(id: string, file: Express.Multer.File): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new Error("User not found!");
      }

      if (user.profilePhoto) {
        const publicId = this.extractPublicId(user.profilePhoto);
        await this.cloudinaryService.deleteFile(publicId);
      }

      const uploadResult = await this.cloudinaryService.uploadProfilePhoto(file);

      user.profilePhoto = uploadResult;
      return await this.userRepository.save(user);
    } catch (error) {
      throw new Error(`Failed to update profile photo: ${error.message}`);
    }
  }

  private extractPublicId(photoUrl: string): string {
    const parts = photoUrl.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.split(".")[0];
  }
}
