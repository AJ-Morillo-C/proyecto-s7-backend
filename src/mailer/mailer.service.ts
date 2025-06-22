import { Injectable } from "@nestjs/common";
import { MailerService as NestMailerService } from "@nestjs-modules/mailer";
import { SendMailDto } from "./dto/send-mail.dto";

@Injectable()
export class MailerService {
  constructor(private readonly nestMailerService: NestMailerService) {}

  async sendMail(sendMailDto: SendMailDto): Promise<void> {
    const { to, subject, template, context } = sendMailDto;

    await this.nestMailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetLink: string, resetToken: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: "Recuperación de contraseña",
      template: "password-reset",
      context: {
        name,
        resetLink,
        resetToken,
      },
    });
  }
}
