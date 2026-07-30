import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { OmitPassword } from "../../common/types/users/omit-password.user";

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): OmitPassword => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
