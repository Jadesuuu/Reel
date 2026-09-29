import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.query.js';
import { SOURCES, type Source } from '../../sources/source.types.js';
import { MAX_SCORE } from '../scorer.js';

export const MATCH_SORTS = ['best', 'newest'] as const;
export type MatchSort = (typeof MATCH_SORTS)[number];

export class ListMatchesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  dismissed: boolean = false;

  @IsOptional()
  @IsIn(SOURCES)
  source?: Source;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_SCORE)
  minScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @IsOptional()
  @IsIn(MATCH_SORTS)
  sort: MatchSort = 'best';
}
