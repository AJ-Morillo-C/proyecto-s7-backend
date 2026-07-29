import { Module } from "@nestjs/common";
import { EditorialsService } from "./editorials.service";
import { EditorialsController } from "./editorials.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EditorialEntity } from "./entities/editorial.entity";

@Module({
  controllers: [EditorialsController],
  providers: [EditorialsService],
  imports: [TypeOrmModule.forFeature([EditorialEntity])],
  exports: [],
})
export class EditorialsModule {}
