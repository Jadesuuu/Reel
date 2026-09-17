import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

export class UpsertCriteriaDto {
  @IsBoolean()
  remoteOnly!: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @Transform(({ value }) => toStringArray(value))
  roleKeywords!: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @Transform(({ value }) => toStringArray(value))
  includeKeywords!: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @Transform(({ value }) => toStringArray(value))
  excludeKeywords!: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minSalaryUsd?: number;
}
