import { Injectable } from "@nestjs/common";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { Repository, UpdateResult } from "typeorm";
import { ReviewEntity } from "./entities/review.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ManagerError } from "src/common/errors/manager.error";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { AllApiResponse, OneApiResponse } from "src/common/interfaces/response-api.interface";
import { BooksService } from "src/books/books.service";

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewsRepository: Repository<ReviewEntity>,
    private readonly booksService: BooksService
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<ReviewEntity> {
    try {
      const existingReview = await this.reviewsRepository.findOne({
        where: {
          userId: createReviewDto.userId,
          bookId: createReviewDto.bookId,
          isActive: true,
        },
      });

      if (existingReview) {
        existingReview.rating = createReviewDto.rating;
        existingReview.comment = createReviewDto.comment;
        const updateReview = await this.reviewsRepository.save(existingReview);
        await this.booksService.updateAverageRating(createReviewDto.bookId);
        return updateReview;
      }

      const review = this.reviewsRepository.create(createReviewDto);
      const savedReview = await this.reviewsRepository.save(review);

      if (!savedReview) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "review not created!",
        });
      }

      await this.booksService.updateAverageRating(createReviewDto.bookId);

      return savedReview;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<AllApiResponse<ReviewEntity>> {
    const { limit, page, bookId } = paginationDto;
    const skip = (page - 1) * limit;
    try {
      const query = this.reviewsRepository
        .createQueryBuilder("review")
        .where("review.isActive = :isActive", { isActive: true });

      if (bookId) {
        query.andWhere("review.bookId = :bookId", { bookId });
      }

      const [total, data] = await Promise.all([
        query.getCount(),
        query
          .leftJoinAndSelect("review.user", "user")
          .leftJoinAndSelect("review.book", "book")
          .take(limit)
          .skip(skip)
          .getMany(),
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

  async findByUser(userId: string) {
    return this.reviewsRepository.find({
      where: { userId, isActive: true },
      relations: { book: true },
    });
  }
  async findByBook(bookId: string) {
    return this.reviewsRepository.find({
      where: { bookId, isActive: true },
      relations: { user: true },
    });
  }

  async findOne(id: string): Promise<OneApiResponse<ReviewEntity>> {
    try {
      const review = await this.reviewsRepository.findOne({
        where: { id, isActive: true },
        relations: ["user", "book"],
      });

      if (!review) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "review not found!",
        });
      }

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: review,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
  async findAllForReviews(paginationDto: PaginationDto & { search?: string }): Promise<AllApiResponse<ReviewEntity>> {
    const { limit, page, bookId, search } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const query = this.reviewsRepository
        .createQueryBuilder("review")
        .where("review.isActive = :isActive", { isActive: true });

      if (bookId) {
        query.andWhere("review.bookId = :bookId", { bookId });
      }

      // Agregar joins para user y book para poder filtrar y devolver relaciones
      query.leftJoinAndSelect("review.user", "user");
      query.leftJoinAndSelect("review.book", "book");

      if (search) {
        query.andWhere("(review.comment ILIKE :search OR user.name ILIKE :search OR book.title ILIKE :search)", {
          search: `%${search}%`,
        });
      }

      // Obtener total de elementos con filtro aplicado
      const total = await query.getCount();

      // Obtener datos paginados
      const data = await query.take(limit).skip(skip).orderBy("review.createdAt", "DESC").getMany();

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

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<ReviewEntity> {
    try {
      const review = await this.reviewsRepository.update({ id }, updateReviewDto);
      if (review.affected === 0) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "review not found!",
        });
      }

      const updatedReview = await this.reviewsRepository.findOne({
        where: { id, isActive: true },
        relations: ["user", "book"],
      });

      return updatedReview;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async remove(id: string): Promise<UpdateResult> {
    try {
      const review = await this.reviewsRepository.update({ id }, { isActive: false });
      if (review.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "review not found!",
        });
      }
      return review;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
}
