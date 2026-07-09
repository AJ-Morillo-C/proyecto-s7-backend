import { HttpException, HttpStatus } from '@nestjs/common';

export class ManagerError extends Error {
  constructor({
    type,
    message,
  }: {
    type: keyof typeof HttpStatus;
    message: string;
  }) {
    super(`${type} :: ${message}`);
  }

  static createSignatureError(message: string) {
    const parts = message.split(' :: ');
    const name = parts[0];
    const description = parts[1];

    if (name && HttpStatus[name as keyof typeof HttpStatus] !== undefined) {
      const statusCode = HttpStatus[name as keyof typeof HttpStatus];
      throw new HttpException(
        {
          error: name,
          statusCode: statusCode,
          message: description || name,
        },
        statusCode,
        {
          cause: new Error(message),
        },
      );
    }

    throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
