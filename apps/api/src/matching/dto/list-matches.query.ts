import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.query.js';
import { SOURCES, type Source } from '../../sources/source.types.js';

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
  @Max(110)
  minScore?: number;
}
