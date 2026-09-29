import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LEVELS } from '../../matching/level.js';

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
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @Transform(({ value }) => toStringArray(value))
  regionKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @Transform(({ value }) => toStringArray(value))
  nearbyKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(LEVELS, { each: true })
  @ArrayMaxSize(5)
  @Transform(({ value }) =>
    toStringArray(value).map((entry) => entry.trim().toLowerCase()),
  )
  levels?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minSalaryUsd?: number;
}
