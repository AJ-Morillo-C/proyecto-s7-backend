import { HttpStatus } from "@nestjs/common";

interface Metadata {
  page: number;
  lastPage: number;
  limit: number;
  total: number;
}

interface Status {
  statusMsg: keyof typeof HttpStatus;
  statusCode: HttpStatus;
  error: string | null;
}

export interface OneApiResponse<T> {
  status: Status;
  data: T;
}

export interface AllApiResponse<T> {
  meta: Metadata;
  status: Status;
  data: T[];
}
export interface GroupedApiResponse<T> {
  status: Status;
  meta: {
    totalCategories: number;
  };
  data: Record<string, T[]>;
}
