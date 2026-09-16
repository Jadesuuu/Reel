import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  postingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  notes?: string;
}
