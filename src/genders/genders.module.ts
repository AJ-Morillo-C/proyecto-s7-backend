import { Module } from "@nestjs/common";
import { GendersService } from "./genders.service";
import { GendersController } from "./genders.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GenderEntity } from "./entities/gender.entity";

@Module({
  controllers: [GendersController],
  providers: [GendersService],
  imports: [TypeOrmModule.forFeature([GenderEntity])],
  exports: [],
})
export class GendersModule {}
