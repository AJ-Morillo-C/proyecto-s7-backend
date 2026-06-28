import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Brackets } from 'typeorm';
import { BookEntity } from '../books/entities/book.entity';
import { FavoriteEntity } from '../favorites/entities/favorite.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';
import { PaginationDto } from '../common/dtos/pagination/pagination.dto';
import { AllApiResponse } from '../common/interfaces/response-api.interface';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(BookEntity)
    private readonly bookRepository: Repository<BookEntity>,
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
  ) {}

  async getPersonalizedRecommendations(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<AllApiResponse<BookEntity>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const favorites = await this.favoriteRepository.find({
      where: { user: { id: userId } },
      relations: ['book', 'book.gender', 'book.author', 'book.editorial'],
    });

    const positiveReviews = await this.reviewRepository.find({
      where: { user: { id: userId }, rating: MoreThanOrEqual(4) },
      relations: ['book', 'book.gender', 'book.author', 'book.editorial'],
    });

    const interactedBookIds = new Set<string>();
    const preferredGenders = new Set<string>();
    const preferredAuthors = new Set<string>();
    const preferredEditorials = new Set<string>();

    const processBook = (book: BookEntity) => {
      if (!book) return;
      interactedBookIds.add(book.id);
      if (book.gender) preferredGenders.add(book.gender.id);
      if (book.author) preferredAuthors.add(book.author.id);
      if (book.editorial) preferredEditorials.add(book.editorial.id);
    };

    favorites.forEach((fav) => processBook(fav.book));
    positiveReviews.forEach((rev) => processBook(rev.book));

    const qb = this.bookRepository.createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.editorial', 'editorial')
      .leftJoinAndSelect('book.gender', 'gender')
      .where('book.isActive = :isActive', { isActive: true });

    if (interactedBookIds.size > 0) {
      qb.andWhere('book.id NOT IN (:...interactedBookIds)', {
        interactedBookIds: Array.from(interactedBookIds),
      });
    }

    if (preferredGenders.size > 0 || preferredAuthors.size > 0 || preferredEditorials.size > 0) {
      qb.andWhere(
        new Brackets((qb2) => {
          if (preferredGenders.size > 0) {
            qb2.orWhere('gender.id IN (:...preferredGenders)', {
              preferredGenders: Array.from(preferredGenders),
            });
          }
          if (preferredAuthors.size > 0) {
            qb2.orWhere('author.id IN (:...preferredAuthors)', {
              preferredAuthors: Array.from(preferredAuthors),
            });
          }
          if (preferredEditorials.size > 0) {
            qb2.orWhere('editorial.id IN (:...preferredEditorials)', {
              preferredEditorials: Array.from(preferredEditorials),
            });
          }
        }),
      );
      qb.orderBy('book.views', 'DESC')
        .addOrderBy('book.downloads', 'DESC')
        .addOrderBy('book.averageRating', 'DESC');
    } else {
      qb.orderBy('RANDOM()');
    }

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      meta: {
        page,
        lastPage: Math.ceil(total / limit),
        limit,
        total,
      },
      status: {
        statusMsg: 'OK',
        statusCode: HttpStatus.OK,
        error: null,
      },
      data,
    };
  }

  async getTrendingRecommendations(
    paginationDto: PaginationDto,
  ): Promise<AllApiResponse<BookEntity>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.bookRepository.createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.editorial', 'editorial')
      .leftJoinAndSelect('book.gender', 'gender')
      .where('book.isActive = :isActive', { isActive: true })
      .orderBy('book.views', 'DESC')
      .addOrderBy('book.downloads', 'DESC')
      .addOrderBy('book.averageRating', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      meta: {
        page,
        lastPage: Math.ceil(total / limit),
        limit,
        total,
      },
      status: {
        statusMsg: 'OK',
        statusCode: HttpStatus.OK,
        error: null,
      },
      data,
    };
  }

  async getSimilarBooks(
    bookId: string,
    paginationDto: PaginationDto,
  ): Promise<AllApiResponse<BookEntity>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const targetBook = await this.bookRepository.findOne({
      where: { id: bookId },
      relations: ['gender', 'author', 'editorial'],
    });

    if (!targetBook) {
      throw new NotFoundException('Book not found');
    }

    const qb = this.bookRepository.createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.editorial', 'editorial')
      .leftJoinAndSelect('book.gender', 'gender')
      .where('book.isActive = :isActive', { isActive: true })
      .andWhere('book.id != :bookId', { bookId });

    if (targetBook.gender || targetBook.author || targetBook.editorial) {
      qb.andWhere(
        new Brackets((qb2) => {
          if (targetBook.gender) {
            qb2.orWhere('gender.id = :genderId', { genderId: targetBook.gender.id });
          }
          if (targetBook.author) {
            qb2.orWhere('author.id = :authorId', { authorId: targetBook.author.id });
          }
          if (targetBook.editorial) {
            qb2.orWhere('editorial.id = :editorialId', { editorialId: targetBook.editorial.id });
          }
        }),
      );
    }

    qb.orderBy('book.views', 'DESC')
      .addOrderBy('book.downloads', 'DESC')
      .addOrderBy('book.averageRating', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      meta: {
        page,
        lastPage: Math.ceil(total / limit),
        limit,
        total,
      },
      status: {
        statusMsg: 'OK',
        statusCode: HttpStatus.OK,
        error: null,
      },
      data,
    };
  }
}
