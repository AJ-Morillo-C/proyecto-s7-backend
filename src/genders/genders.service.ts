import { Injectable } from "@nestjs/common";
import { CreateGenderDto } from "./dto/create-gender.dto";
import { UpdateGenderDto } from "./dto/update-gender.dto";
import { Repository, UpdateResult } from "typeorm";
import { GenderEntity } from "./entities/gender.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ManagerError } from "src/common/errors/manager.error";
import { PaginationDto } from "src/common/dtos/pagination/pagination.dto";
import { AllApiResponse, OneApiResponse } from "src/common/interfaces/response-api.interface";

@Injectable()
export class GendersService {
  constructor(
    @InjectRepository(GenderEntity)
    private readonly gendersRepository: Repository<GenderEntity>
  ) {}

  async create(createGenderDto: CreateGenderDto): Promise<GenderEntity> {
    try {
      const gender = await this.gendersRepository.save(createGenderDto);
      if (!gender) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "gender not created!",
        });
      }
      return gender;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
  async findAllNames(): Promise<string[]> {
    try {
      const gendersWithBooks = await this.gendersRepository
        .createQueryBuilder("gender")
        .leftJoin("gender.books", "book")
        .where("gender.isActive = true")
        .andWhere("book.id IS NOT NULL") // solo géneros con al menos un libro
        .select("DISTINCT gender.genderName", "name")
        .orderBy("gender.genderName", "ASC")
        .getRawMany();

      return gendersWithBooks.map((g) => g.name);
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<AllApiResponse<GenderEntity>> {
    const { limit, page } = paginationDto;
    const skip = (page - 1) * limit;
    try {
      const [total, data] = await Promise.all([
        this.gendersRepository.count({ where: { isActive: true } }),
        this.gendersRepository.createQueryBuilder("gender").where({ isActive: true }).take(limit).skip(skip).getMany(),
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

  async findAllForAdmin(paginationDto: PaginationDto): Promise<AllApiResponse<GenderEntity>> {
    const { limit, page, q } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.gendersRepository.createQueryBuilder("gender").where("gender.isActive = true");

    if (q && q.trim() !== "") {
      queryBuilder.andWhere("(LOWER(gender.genderName) LIKE LOWER(:q) OR LOWER(gender.description) LIKE LOWER(:q))", {
        q: `%${q}%`,
      });
    }

    try {
      const [data, total] = await Promise.all([
        queryBuilder.clone().take(limit).skip(skip).getMany(),
        queryBuilder.clone().getCount(),
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
  async findOne(id: string): Promise<OneApiResponse<GenderEntity>> {
    try {
      const gender = await this.gendersRepository.createQueryBuilder("gender").where({ id, isActive: true }).getOne();

      if (!gender) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "gender not found!",
        });
      }

      return {
        status: {
          statusMsg: "ACCEPTED",
          statusCode: 200,
          error: null,
        },
        data: gender,
      };
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async update(id: string, updateGenderDto: UpdateGenderDto): Promise<UpdateResult> {
    try {
      const gender = await this.gendersRepository.update({ id }, updateGenderDto);
      if (gender.affected === 0) {
        throw new ManagerError({
          type: "CONFLICT",
          message: "gender not found!",
        });
      }
      return gender;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }

  async remove(id: string): Promise<UpdateResult> {
    try {
      const gender = await this.gendersRepository.update({ id }, { isActive: false });
      if (gender.affected === 0) {
        throw new ManagerError({
          type: "NOT_FOUND",
          message: "gender not found!",
        });
      }
      return gender;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
}
