import { Module } from '@nestjs/common';
import { HnClient } from './hn.client.js';

@Module({
  providers: [HnClient],
  exports: [HnClient],
})
export class HnModule {}
