import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { PublicAccess } from "src/auth/decorators/public.decorator";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @PublicAccess()
  @Post()
  @UseInterceptors(FileInterceptor("profilePhoto"))
  async create(@Body() createUserDto: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
    return this.usersService.create(createUserDto, file);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }
  @Get("/search")
  async findAllForUsers(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAllForUsers(paginationDto);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Post(":id/photo")
  @UseInterceptors(FileInterceptor("file"))
  async updatePhoto(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    return await this.usersService.updateProfilePhoto(id, file);
  }
}
