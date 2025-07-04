import { SetMetadata } from "@nestjs/common";
import { PUBLIC_KEY } from "../../common/constants/keys-roles.constant";

export const PublicAccess = () => SetMetadata(PUBLIC_KEY, true);
