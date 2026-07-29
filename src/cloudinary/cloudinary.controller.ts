import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("cloudinary")
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadFile(file);
    return result;
  }

  @Post("uploadProfilePhoto")
  @UseInterceptors(FileInterceptor("profilePhoto"))
  async uploadProfilePhoto(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadProfilePhoto(file);
    return result;
  }
}
