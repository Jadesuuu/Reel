import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PollDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  userAgent?: string;
}
