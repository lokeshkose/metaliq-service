import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: nodemailer.SendMailOptions['attachments']; // ✅ FIX
  }) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        ...options,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
