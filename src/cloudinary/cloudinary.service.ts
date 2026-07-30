import { Inject, Injectable } from "@nestjs/common";
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from "cloudinary";

@Injectable()
export class CloudinaryService {
  private readonly defaultAvatarPhoto =
    "https://res.cloudinary.com/dpcg87uv0/image/upload/v1745206740/profile_photos/ekchd8fedtuasbspjj2e.jpg";

  constructor(@Inject("CLOUDINARY") private cloudinary) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream({ resource_type: "auto", folder: "files", fomart: "pdf" }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(file.buffer);
    });
  }

  async uploadProfilePhoto(file: Express.Multer.File): Promise<string> {
    if (!file) {
      return this.defaultAvatarPhoto;
    }

    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream({ resource_type: "image", folder: "profile_photos", format: "jpg" }, (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        })
        .end(file.buffer);
    });
  }

  async uploadAuthorPhoto(file: Express.Multer.File): Promise<string> {
    if (!file) {
      return this.defaultAvatarPhoto;
    }

    return new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream({ resource_type: "image", folder: "authors_photos", format: "jpg" }, (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        })
        .end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
