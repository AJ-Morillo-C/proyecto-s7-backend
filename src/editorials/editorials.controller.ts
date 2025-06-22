import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { EditorialsService } from "./editorials.service";
import { CreateEditorialDto } from "./dto/create-editorial.dto";
import { UpdateEditorialDto } from "./dto/update-editorial.dto";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";

@Controller("editorials")
export class EditorialsController {
  constructor(private readonly editorialsService: EditorialsService) {}

  @Post()
  create(@Body() createEditorialDto: CreateEditorialDto) {
    return this.editorialsService.create(createEditorialDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.editorialsService.findAll(paginationDto);
  }

  @Get("/search")
  findAllForEditorials(@Query() paginationDto: PaginationDto) {
    return this.editorialsService.findAllForEditorials(paginationDto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.editorialsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateEditorialDto: UpdateEditorialDto) {
    return this.editorialsService.update(id, updateEditorialDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.editorialsService.remove(id);
  }
}
