import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { ADMIN_KEY, PUBLIC_KEY, ROLES_KEY } from "./../../common/constants/keys-roles.constant";
import { UserRole } from "./../../common/enums/user-role.enum";
import { ManagerError } from "./../../common/errors/manager.error";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const isAdmin = this.reflector.get<string>(ADMIN_KEY, context.getHandler());
    const isPublic = this.reflector.get<boolean>(PUBLIC_KEY, context.getHandler());
    const isRoles = this.reflector.get<Array<keyof typeof UserRole>>(ROLES_KEY, context.getHandler());

    const UNAUTHORIZED_ERROR = new ManagerError({
      type: "UNAUTHORIZED",
      message: "Unauthorized!",
    });

    const user = request.user as { id: string; role: UserRole }; // Tipo explícito

    if (isPublic) return true;

    try {
      if (isRoles === undefined) {
        if (!isAdmin || user?.role === isAdmin) {
          // Verificación segura
          return true;
        }
        throw UNAUTHORIZED_ERROR;
      }

      if (user?.role === UserRole.ADMIN) {
        // Verificación segura
        return true;
      }

      const isAuth = isRoles.includes(user?.role); // Verificación segura
      if (!isAuth) {
        throw UNAUTHORIZED_ERROR;
      }

      return true;
    } catch (error) {
      ManagerError.createSignatureError(error.message);
    }
  }
}
