import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { Mailer, MailMessage } from './mailer.interface.js';

export class ResendMailer implements Mailer {
  private readonly logger = new Logger(ResendMailer.name);
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: MailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });

    if (error) {
      this.logger.error(`Resend rejected the message: ${error.message}`);
      throw new Error(error.message);
    }
  }
}
