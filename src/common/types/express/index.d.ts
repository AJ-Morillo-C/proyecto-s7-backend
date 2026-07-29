import { Request } from "express";
import { OmitPassword } from "../users/omit-password.user";

declare namespace Express {
  export interface Request {
    user: OmitPassword;
  }
}

declare module "express" {
  export interface Request {
    cookies: { [key: string]: string };
  }
}
