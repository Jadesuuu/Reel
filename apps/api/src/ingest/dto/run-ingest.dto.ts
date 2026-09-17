import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RunIngestDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  threadId?: string;
}
