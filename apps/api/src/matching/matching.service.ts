import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchingService {
  // TODO(step-9): score every posting against each user's criteria.
  async rescoreAllUsers(): Promise<void> {
    return Promise.resolve();
  }
}
