import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { BookEntity } from '../books/entities/book.entity';
import { FavoriteEntity } from '../favorites/entities/favorite.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookEntity, FavoriteEntity, ReviewEntity]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
