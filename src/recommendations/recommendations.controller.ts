import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationsService } from './recommendations.service';
import { PaginationDto } from '../common/dtos/pagination/pagination.dto';
import { PublicAccess } from '../auth/decorators/public.decorator';
import { AllApiResponse } from '../common/interfaces/response-api.interface';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  async getPersonalizedRecommendations(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
  ): Promise<AllApiResponse<any>> {
    const user = req.user as any;
    return this.recommendationsService.getPersonalizedRecommendations(user.id, paginationDto);
  }

  @PublicAccess()
  @Get('trending')
  async getTrendingRecommendations(
    @Query() paginationDto: PaginationDto,
  ): Promise<AllApiResponse<any>> {
    return this.recommendationsService.getTrendingRecommendations(paginationDto);
  }

  @PublicAccess()
  @Get('similar/:bookId')
  async getSimilarBooks(
    @Param('bookId') bookId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<AllApiResponse<any>> {
    return this.recommendationsService.getSimilarBooks(bookId, paginationDto);
  }
}
