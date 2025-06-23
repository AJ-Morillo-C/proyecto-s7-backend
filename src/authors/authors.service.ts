import { Injectable } from "@nestjs/common";
import { CreateAuthorDto } from "./dto/create-author.dto";
import { UpdateAuthorDto } from "./dto/update-author.dto";
import { Repository, UpdateResult } from "typeorm";
import { AuthorEntity } from "./entities/author.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ManagerError } from "src/common/errors/manager.error";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { AllApiResponse, OneApiResponse } from "src/common/interfaces/response-api.interface";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { BooksService } from "src/books/books.service";

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(AuthorEntity)
    private readonly authorsRepository: Repository<AuthorEntity>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly bookService: BooksService
  ) {}
  async getBooksByAuthor(authorId: string) {
    return this.bookService.findByAuthorId(authorId);
  }

  async create(createAuthorDto: CreateAuthorDto, file?: Express.Multer.File): Promise<AuthorEntity> {
    try {
      const photo = await this.cloudinaryService.uploadAuthorPhoto(file);

      const authorData = { ...createAuthorDto, photo };

      const author = await this.authorsRepository.save(authorData);
      if (!author) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "author not created!",
        });
      }
      return author;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
  async searchAuthors(paginationDto: PaginationDto & { search?: string }): Promise<AllApiResponse<AuthorEntity>> {
    const { search } = paginationDto;
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 3;

    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.authorsRepository.createQueryBuilder("author").where("author.isActive = true");

      if (search && search.trim() !== "") {
        const terms = search.trim().toLowerCase().split(/\s+/);

        terms.forEach((term, index) => {
          queryBuilder.andWhere(`LOWER(author.authorName) LIKE :term${index}`, {
            [`term${index}`]: `%${term}%`,
          });
        });
      }

      const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

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

  async findAll(paginationDto: PaginationDto): Promise<AllApiResponse<AuthorEntity>> {
    const { limit, page } = paginationDto;
    const skip = (page - 1) * limit;
    try {
      const [total, data] = await Promise.all([
        this.authorsRepository.count({ where: { isActive: true } }),
        this.authorsRepository.createQueryBuilder("author").where({ isActive: true }).take(limit).skip(skip).getMany(),
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
  async findTopAuthors(
    limit: number = 5
  ): Promise<Array<{ id: string; authorName: string; biography: string; photo: string; booksCount: number }>> {
    try {
      const authorsWithCount = await this.authorsRepository
        .createQueryBuilder("author")
        .leftJoin("author.books", "book")
        .where("author.isActive = true")
        .select([
          "author.id AS id",
          "author.authorName AS authorName",
          "author.biography AS biography",
          "author.photo AS photo",
          "COUNT(book.id)::int AS booksCount",
        ])
        .groupBy("author.id")
        .orderBy("booksCount", "DESC")
        .limit(limit)
        .getRawMany();

      return authorsWithCount.map((raw) => ({
        id: raw.id,
        authorName: raw.authorname, // cuidado con el casing
        biography: raw.biography,
        photo: raw.photo,
        booksCount: raw.bookscount, // cuidado: revisar aquí el nombre exacto en consola
      }));
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findOne(id: string): Promise<OneApiResponse<AuthorEntity>> {
    try {
      const author = await this.authorsRepository.createQueryBuilder("author").where({ id, isActive: true }).getOne();

      if (!author) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "author not found!",
        });
      }

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: author,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async updateModificado(
    id: string,
    updateAuthorDto: UpdateAuthorDto,
    file?: Express.Multer.File
  ): Promise<AuthorEntity> {
    try {
      const author = await this.authorsRepository.findOne({ where: { id } });

      if (!author) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "author not found!",
        });
      }

      if (file) {
        if (author.photo) {
          const publicId = this.extractPublicId(author.photo);
          await this.cloudinaryService.deleteFile(publicId);
        }

        const newPhoto = await this.cloudinaryService.uploadAuthorPhoto(file);
        updateAuthorDto.photo = newPhoto;
      }

      await this.authorsRepository.update(id, updateAuthorDto);

      return await this.authorsRepository.findOne({ where: { id } });
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<UpdateResult> {
    try {
      const author = await this.authorsRepository.update({ id }, updateAuthorDto);
      if (author.affected === 0) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "author not found!",
        });
      }
      return author;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async remove(id: string): Promise<UpdateResult> {
    try {
      const author = await this.authorsRepository.update({ id }, { isActive: false });
      if (author.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "author not found!",
        });
      }
      return author;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  private extractPublicId(photoUrl: string): string {
    const parts = photoUrl.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.split(".")[0];
  }

  async updatePhoto(id: string, file: Express.Multer.File): Promise<AuthorEntity> {
    try {
      const author = await this.authorsRepository.findOne({ where: { id } });
      if (!author) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "author not found!",
        });
      }

      if (author.photo) {
        const publicId = this.extractPublicId(author.photo);
        await this.cloudinaryService.deleteFile(publicId);
      }

      const uploadResult = await this.cloudinaryService.uploadProfilePhoto(file);

      author.photo = uploadResult;
      return await this.authorsRepository.save(author);
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
}
