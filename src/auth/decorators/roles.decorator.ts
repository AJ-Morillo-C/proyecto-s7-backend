import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../../common/constants/keys-roles.constant';
import { UserRole } from '../../common/enums/user-role.enum';

export const RolesAccess = (...roles: Array<keyof typeof UserRole>) =>
  SetMetadata(ROLES_KEY, roles);
