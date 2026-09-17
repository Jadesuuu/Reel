import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.query.js';

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
  @IsString()
  @MaxLength(32)
  threadId?: string;
}
