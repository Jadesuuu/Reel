import { Logger } from '@nestjs/common';
import type { Mailer, MailMessage } from './mailer.interface.js';

export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger(ConsoleMailer.name);

  send(message: MailMessage): Promise<void> {
    this.logger.log(
      `To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`,
    );
    return Promise.resolve();
  }
}
