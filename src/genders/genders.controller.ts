import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { GendersService } from "./genders.service";
import { CreateGenderDto } from "./dto/create-gender.dto";
import { UpdateGenderDto } from "./dto/update-gender.dto";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { PublicAccess } from "src/auth/decorators/public.decorator";

@Controller("genders")
export class GendersController {
  constructor(private readonly gendersService: GendersService) {}

  @Post()
  create(@Body() createGenderDto: CreateGenderDto) {
    return this.gendersService.create(createGenderDto);
  }
  @PublicAccess()
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.gendersService.findAll(paginationDto);
  }

  @Get("/search")
  findAllForAdmin(@Query() paginationDto: PaginationDto) {
    return this.gendersService.findAllForAdmin(paginationDto);
  }
  @PublicAccess()
  @Get("/names")
  findAllNames() {
    return this.gendersService.findAllNames();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.gendersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateGenderDto: UpdateGenderDto) {
    return this.gendersService.update(id, updateGenderDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.gendersService.remove(id);
  }
}
