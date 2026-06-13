import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { UpdateFavoriteDto } from "./dto/update-favorite.dto";
import { PaginationDto } from "../common/dtos/pagination/pagination.dto";
import { Req } from "@nestjs/common";
import { Request } from "express";

@Controller("favorites")
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async create(@Req() req: Request, @Body() createFavoriteDto: CreateFavoriteDto) {
    const user = req.user as any; // req.user viene del token
    return this.favoritesService.create(user.id, createFavoriteDto);
  }

  @Get()
  async findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const user = req.user as any; // o la forma como obtienes el usuario desde el JWT
    return this.favoritesService.findAll(user.id, paginationDto);
  }

  @Get("Authors")
  async findAuthors(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const user = req.user as any;
    return this.favoritesService.findAuthors(user.id, paginationDto);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.favoritesService.findOne(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateFavoriteDto: UpdateFavoriteDto) {
    return this.favoritesService.update(id, updateFavoriteDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.favoritesService.remove(id);
  }
}