import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { AuthorsService } from "./authors.service";
import { CreateAuthorDto } from "./dto/create-author.dto";
import { UpdateAuthorDto } from "./dto/update-author.dto";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { PublicAccess } from "src/auth/decorators/public.decorator";

@Controller("authors")
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("photo"))
  async create(@Body() createAuthorDto: CreateAuthorDto, @UploadedFile() file?: Express.Multer.File) {
    return this.authorsService.create(createAuthorDto, file);
  }
  @PublicAccess()
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.authorsService.findAll(paginationDto);
  }
  @PublicAccess()
  @Get("search")
  async searchAuthors(@Query() paginationDto: PaginationDto & { search?: string }) {
    return this.authorsService.searchAuthors(paginationDto);
  }
  @PublicAccess()
  @Get("/top")
  async getTopAuthors(@Query("limit") limit?: string) {
    const parsedLimit = parseInt(limit || "5", 10);
    const authors = await this.authorsService.findTopAuthors(parsedLimit);
    return authors;
  }

  @PublicAccess()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.authorsService.findOne(id);
  }
  @PublicAccess()
  @Get(":id/books")
  async getBooksByAuthor(@Param("id") id: string) {
    return this.authorsService.getBooksByAuthor(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateAuthorDto: UpdateAuthorDto) {
    return this.authorsService.update(id, updateAuthorDto);
  }
  @Patch("/update/:id")
  @UseInterceptors(FileInterceptor("photo"))
  async updateModificado(
    @Param("id") id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.authorsService.updateModificado(id, updateAuthorDto, file);
  }
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.authorsService.remove(id);
  }

  @Post(":id/photo")
  @UseInterceptors(FileInterceptor("file"))
  async updatePhoto(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    return await this.authorsService.updatePhoto(id, file);
  }
}
