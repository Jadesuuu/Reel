import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.query.js';
import { SOURCES, type Source } from '../../sources/source.types.js';

export enum RemoteTypeQuery {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  ONSITE = 'ONSITE',
  UNKNOWN = 'UNKNOWN',
}

export class ListPostingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(RemoteTypeQuery)
  remote?: RemoteTypeQuery;

  @IsOptional()
  @IsIn(SOURCES)
  source?: Source;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  boardId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  stack?: string;
}
