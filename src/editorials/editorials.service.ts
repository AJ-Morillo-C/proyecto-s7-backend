import { Injectable } from "@nestjs/common";
import { CreateEditorialDto } from "./dto/create-editorial.dto";
import { UpdateEditorialDto } from "./dto/update-editorial.dto";
import { Repository, UpdateResult } from "typeorm";
import { EditorialEntity } from "./entities/editorial.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ManagerError } from "src/common/errors/manager.error";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { AllApiResponse, OneApiResponse } from "src/common/interfaces/response-api.interface";

@Injectable()
export class EditorialsService {
  constructor(
    @InjectRepository(EditorialEntity)
    private readonly editorialsRepository: Repository<EditorialEntity>
  ) {}

  async create(createEditorialDto: CreateEditorialDto): Promise<EditorialEntity> {
    try {
      const editorial = await this.editorialsRepository.save(createEditorialDto);
      if (!editorial) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "editorial not created!",
        });
      }
      return editorial;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<AllApiResponse<EditorialEntity>> {
    const { limit, page } = paginationDto;
    const skip = (page - 1) * limit;
    try {
      const [total, data] = await Promise.all([
        this.editorialsRepository.count({ where: { isActive: true } }),
        this.editorialsRepository
          .createQueryBuilder("editorial")
          .where({ isActive: true })
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
  async findAllForEditorials(paginationDto: PaginationDto): Promise<AllApiResponse<EditorialEntity>> {
    const { limit, page, search } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const query = this.editorialsRepository.createQueryBuilder("editorial").where("editorial.isActive = true");

      if (search) {
        query.andWhere("LOWER(editorial.editorialName) LIKE :search", {
          search: `%${search.toLowerCase()}%`,
        });
      }

      const [data, total] = await Promise.all([
        query.clone().take(limit).skip(skip).getMany(),
        query.clone().getCount(),
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

  async findOne(id: string): Promise<OneApiResponse<EditorialEntity>> {
    try {
      const editorial = await this.editorialsRepository
        .createQueryBuilder("editorial")
        .where({ id, isActive: true })
        .getOne();

      if (!editorial) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "editorial not found!",
        });
      }

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: editorial,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async update(id: string, updateEditorialDto: UpdateEditorialDto): Promise<UpdateResult> {
    try {
      const editorial = await this.editorialsRepository.update({ id }, updateEditorialDto);
      if (editorial.affected === 0) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "editorial not found!",
        });
      }
      return editorial;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async remove(id: string): Promise<UpdateResult> {
    try {
      const editorial = await this.editorialsRepository.update({ id }, { isActive: false });
      if (editorial.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "editorial not found!",
        });
      }
      return editorial;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
}
