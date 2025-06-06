import { Injectable } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Repository, UpdateResult } from 'typeorm';
import { AuthorEntity } from './entities/author.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ManagerError } from 'src/common/errors/manager.error';
import { PaginationDto } from 'src/common/dtos/pagination/pagination.dto';
import { AllApiResponse, OneApiResponse } from 'src/common/interfaces/response-api.interface';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AuthorsService {

  constructor(
    @InjectRepository(AuthorEntity)
    private readonly authorsRepository: Repository<AuthorEntity>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(createAuthorDto: CreateAuthorDto, file?: Express.Multer.File): Promise<AuthorEntity> {
    try {
      const photo = await this.cloudinaryService.uploadAuthorPhoto(file);

      const authorData = { ...createAuthorDto, photo }

      const author = await this.authorsRepository.save(authorData);
      if (!author) {
        throw new ManagerError({
          type: 'CONFLICT',
          message: 'author not created!'
        })
      }
      return author;
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
        this.authorsRepository
          .createQueryBuilder('author')
          .where({ isActive: true })
          .take(limit)
          .skip(skip)
          .getMany(),
      ])

      const lastPage = Math.ceil(total / limit);
      return {
        status: {
          statusMsg: 'ACCEPTED',
          statusCode: 200,
          error: null
        },
        meta: {
          page,
          limit,
          lastPage,
          total,
        },
        data
      }
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findOne(id: string): Promise<OneApiResponse<AuthorEntity>> {
    try {
      const author = await this.authorsRepository
        .createQueryBuilder('author')
        .where({ id, isActive: true })
        .getOne();

      if (!author) {
        throw new ManagerError({
          type: 'NOT_FOUND',
          message: 'author not found!'
        })
      }

      return {
        status: {
          statusMsg: 'ACCEPTED',
          statusCode: 200,
          error: null
        },
        data: author
      }
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<UpdateResult> {
    try {
      const author = await this.authorsRepository.update({ id }, updateAuthorDto)
      if (author.affected === 0) {
        throw new ManagerError({
          type: 'CONFLICT',
          message: 'author not found!'
        })
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
          type: 'NOT_FOUND',
          message: 'author not found!'
        })
      }
      return author;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  private extractPublicId(photoUrl: string): string {
    const parts = photoUrl.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('.')[0];
  }

  async updatePhoto(id: string, file: Express.Multer.File): Promise<AuthorEntity> {
    try {
      const author = await this.authorsRepository.findOne({ where: { id } });
      if (!author) {
        throw new ManagerError({
          type: 'NOT_FOUND',
          message: 'author not found!'
        })
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