import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CompleteRunDto {
  @IsOptional()
  @IsArray()
  items?: unknown[];

  @IsOptional()
  @IsInt()
  @Min(0)
  pagesFetched?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  error?: string;
}
