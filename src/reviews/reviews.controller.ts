import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.reviewsService.findAll(paginationDto);
  }

  @Get("/search")
  findAllForReviews(@Query() paginationDto: PaginationDto) {
    return this.reviewsService.findAllForReviews(paginationDto);
  }

  @Get("filter")
  findWithFilters(
    @Query("userId") userId: string,
    @Query("bookId") bookId: string,
    @Query("limit") limit = 10,
    @Query("offset") offset = 1
  ) {
    if (userId) return this.reviewsService.findByUser(userId);
    if (bookId) return this.reviewsService.findByBook(bookId);
    return this.reviewsService.findAll({ limit: +limit, page: +offset });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reviewsService.remove(id);
  }
}
