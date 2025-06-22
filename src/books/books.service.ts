import { Injectable } from "@nestjs/common";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { Repository, UpdateResult } from "typeorm";
import { BookEntity } from "./entities/book.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ManagerError } from "src/common/errors/manager.error";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { AllApiResponse, OneApiResponse, GroupedApiResponse } from "src/common/interfaces/response-api.interface";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(BookEntity)
    private readonly bookRepository: Repository<BookEntity>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(createBookDto: CreateBookDto, file: Express.Multer.File): Promise<BookEntity> {
    try {
      if (!file) {
        throw new ManagerError({
          type: "BAD_REQUEST",
          message: "File is required!",
        });
      }
      const uploadedFile = await this.cloudinaryService.uploadFile(file);

      const { author, editorial, gender, ...bookData } = createBookDto;
      const book = this.bookRepository.create({
        ...bookData,
        file: uploadedFile.secure_url,
        author: author ? { id: author } : undefined,
        editorial: editorial ? { id: editorial } : undefined,
        gender: gender ? { id: gender } : undefined,
      });

      const savedBook = await this.bookRepository.save(book);
      if (!savedBook) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "Book not created!",
        });
      }
      return savedBook;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<AllApiResponse<any>> {
    const { limit, page } = paginationDto;
    const skip = (page - 1) * limit;
    try {
      const [total, data] = await Promise.all([
        this.bookRepository.count({ where: { isActive: true } }),
        this.bookRepository
          .createQueryBuilder("book")
          .leftJoinAndSelect("book.author", "author")
          .leftJoinAndSelect("book.editorial", "editorial")
          .leftJoinAndSelect("book.gender", "gender")
          .where("book.isActive = :isActive", { isActive: true })
          .take(limit)
          .skip(skip)
          .getMany(),
      ]);

      const lastPage = Math.ceil(total / limit);

      if (!data) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "books not found!",
        });
      }

      const mappedData = data.map((book) => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author ? book.author.authorName : null,
        editorial: book.editorial ? book.editorial.editorialName : null,
        gender: book.gender ? book.gender.genderName : null,
        publicationDate: book.publicationDate,
        synopsis: book.synopsis,
        file: book.file,
        views: book.views,
        downloads: book.downloads,
        averageRating: book.averageRating,
        isActive: book.isActive,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      }));

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
        data: mappedData,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
  async findByAuthorId(authorId: string): Promise<AllApiResponse<any>> {
    try {
      const books = await this.bookRepository
        .createQueryBuilder("book")
        .leftJoinAndSelect("book.author", "author")
        .leftJoinAndSelect("book.editorial", "editorial")
        .leftJoinAndSelect("book.gender", "gender")
        .where("book.author.id = :authorId", { authorId })
        .andWhere("book.isActive = true")
        .getMany();

      const mappedBooks = books.map((book) => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author?.authorName,
        editorial: book.editorial?.editorialName,
        gender: book.gender?.genderName,
        publicationDate: book.publicationDate,
        synopsis: book.synopsis,
        file: book.file,
        views: book.views,
        downloads: book.downloads,
        averageRating: book.averageRating,
        isActive: book.isActive,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      }));

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        meta: {
          page: 1,
          limit: mappedBooks.length,
          lastPage: 1,
          total: mappedBooks.length,
        },
        data: mappedBooks,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async SearchBook(paginationDto: PaginationDto): Promise<AllApiResponse<any>> {
    const { limit, page, search, q } = paginationDto;
    const skip = (page - 1) * limit;
    const searchValue = search || q;

    try {
      const queryBuilder = this.bookRepository
        .createQueryBuilder("book")
        .leftJoinAndSelect("book.author", "author")
        .leftJoinAndSelect("book.editorial", "editorial")
        .leftJoinAndSelect("book.gender", "gender")
        .where("book.isActive = :isActive", { isActive: true });

      if (searchValue) {
        queryBuilder.andWhere(
          `(CAST(book.isbn AS TEXT) ILIKE :search
    OR LOWER(book.title) ILIKE LOWER(:search)
    OR LOWER(author.authorName) ILIKE LOWER(:search)
    OR LOWER(editorial.editorialName) ILIKE LOWER(:search)
    OR LOWER(gender.genderName) ILIKE LOWER(:search)
    OR CAST(book.publicationDate AS TEXT) ILIKE :search)`,
          { search: `%${searchValue}%` }
        );
      }

      const [data, total] = await Promise.all([queryBuilder.take(limit).skip(skip).getMany(), queryBuilder.getCount()]);

      const lastPage = Math.ceil(total / limit);

      const mappedData = data.map((book) => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author?.authorName,
        editorial: book.editorial?.editorialName,
        gender: book.gender?.genderName,
        publicationDate: book.publicationDate,
        synopsis: book.synopsis,
        file: book.file,
        views: book.views,
        downloads: book.downloads,
        averageRating: book.averageRating,
        isActive: book.isActive,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      }));

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
        data: mappedData,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findOne(id: string): Promise<OneApiResponse<any>> {
    try {
      const book = await this.bookRepository
        .createQueryBuilder("book")
        .where({ id, isActive: true })
        .leftJoinAndSelect("book.author", "author")
        .leftJoinAndSelect("book.editorial", "editorial")
        .leftJoinAndSelect("book.gender", "gender")
        .getOne();

      if (!book) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "Book not found!",
        });
      }

      // Increment views counter
      await this.bookRepository.update(id, { views: () => "views + 1" });

      const mappedBook = {
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author ? book.author.authorName : null,
        editorial: book.editorial ? book.editorial.editorialName : null,
        gender: book.gender ? book.gender.genderName : null,
        publicationDate: book.publicationDate,
        synopsis: book.synopsis,
        file: book.file,
        views: book.views,
        downloads: book.downloads,
        averageRating: book.averageRating,
        isActive: book.isActive,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      };

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: mappedBook,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
  async findTopViewed(limit: number = 5): Promise<AllApiResponse<any>> {
    try {
      const books = await this.bookRepository.find({
        where: { isActive: true },
        order: { views: "DESC" },
        take: limit,
        relations: ["author", "editorial", "gender"],
      });

      const mappedBooks = books.map((book) => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author?.authorName,
        editorial: book.editorial?.editorialName,
        gender: book.gender?.genderName,
        publicationDate: book.publicationDate,
        synopsis: book.synopsis,
        file: book.file,
        views: book.views,
        downloads: book.downloads,
        averageRating: book.averageRating,
        isActive: book.isActive,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      }));

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        meta: {
          page: 1,
          limit,
          lastPage: 1,
          total: mappedBooks.length,
        },
        data: mappedBooks,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findTopDownloaded(limit: number = 5): Promise<AllApiResponse<any>> {
    try {
      const books = await this.bookRepository.find({
        where: { isActive: true },
        order: { downloads: "DESC" },
        take: limit,
        relations: ["author", "editorial", "gender"],
      });

      const mappedBooks = books.map((book) => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author?.authorName,
        editorial: book.editorial?.editorialName,
        gender: book.gender?.genderName,
        publicationDate: book.publicationDate,
        synopsis: book.synopsis,
        file: book.file,
        views: book.views,
        downloads: book.downloads,
        averageRating: book.averageRating,
        isActive: book.isActive,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      }));

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        meta: {
          page: 1,
          limit,
          lastPage: 1,
          total: mappedBooks.length,
        },
        data: mappedBooks,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
  async findTopBooksGroupedByCategory(): Promise<GroupedApiResponse<any>> {
    try {
      const allBooks = await this.bookRepository
        .createQueryBuilder("book")
        .leftJoinAndSelect("book.gender", "gender")
        .leftJoinAndSelect("book.author", "author")
        .leftJoinAndSelect("book.editorial", "editorial")
        .where("book.isActive = true")
        .orderBy("book.createdAt", "DESC")
        .getMany();

      const grouped = allBooks.reduce(
        (acc, book) => {
          const category = book.gender?.genderName || "Sin categoría";
          if (!acc[category]) acc[category] = [];
          if (acc[category].length < 6) acc[category].push(book);
          return acc;
        },
        {} as Record<string, any[]>
      );

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        meta: {
          totalCategories: Object.keys(grouped).length,
        },
        data: grouped,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async update(id: string, updateBookDto: UpdateBookDto, file?: Express.Multer.File): Promise<UpdateResult> {
    try {
      let updatedData = { ...updateBookDto };

      if (file) {
        const uploadedFile = await this.cloudinaryService.uploadFile(file);
        updatedData = { ...updatedData, file: uploadedFile.secure_url };
      }

      const { author, editorial, gender, ...bookData } = updatedData;
      const updateData = {
        ...bookData,
        author: author ? { id: author } : undefined,
        editorial: editorial ? { id: editorial } : undefined,
        gender: gender ? { id: gender } : undefined,
      };

      const book = await this.bookRepository.update({ id }, updateData);
      if (book.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "Book not found!",
        });
      }
      return book;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async remove(id: string): Promise<{ status: any; data: UpdateResult }> {
    try {
      const book = await this.bookRepository.update({ id }, { isActive: false });
      if (book.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "book not found!",
        });
      }
      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: book,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async incrementDownloads(id: string): Promise<OneApiResponse<BookEntity>> {
    try {
      const result = await this.bookRepository.update(id, { downloads: () => "downloads + 1" });

      if (result.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "Book not found!",
        });
      }

      const updatedBook = await this.bookRepository.findOne({ where: { id } });

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: updatedBook,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async updateAverageRating(id: string): Promise<void> {
    try {
      const book = await this.bookRepository
        .createQueryBuilder("book")
        .where({ id: id, isActive: true })
        .leftJoinAndSelect("book.reviews", "review", "review.isActive = :isActive", { isActive: true })
        .getOne();

      if (!book || !book.reviews || book.reviews.length === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "Book not found!",
        });
      }

      const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / book.reviews.length;

      await this.bookRepository.update(id, { averageRating });
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async getDownloadUrl(id: string): Promise<{ status: any; data: string }> {
    try {
      await this.incrementDownloads(id);

      const book = await this.bookRepository.findOne({ where: { id } });
      if (!book || !book.file) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "Book not found!",
        });
      }

      const downloadUrl = book.file.replace("/upload", `/upload/fl_attachment:${book.title.replace(/\s+/g, "_")}/`);

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: downloadUrl,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
}
