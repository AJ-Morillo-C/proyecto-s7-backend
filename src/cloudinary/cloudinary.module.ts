import { Module } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";
import { CloudinaryProvider } from "./provider/cloudinary.provider";
import { CloudinaryController } from "./cloudinary.controller";

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService],
  controllers: [CloudinaryController],
})
export class CloudinaryModule {}
