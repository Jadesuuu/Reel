import { Injectable } from '@nestjs/common';

@Injectable()
export class RemindersService {
  // TODO(step-11): schedule a delayed BullMQ job and persist the Reminder row.
  async schedule(_applicationId: string, _from: Date): Promise<void> {
    return Promise.resolve();
  }

  // TODO(step-11): cancel the delayed job and mark the Reminder cancelled.
  async cancel(_applicationId: string): Promise<void> {
    return Promise.resolve();
  }
}
