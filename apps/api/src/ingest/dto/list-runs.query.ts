import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.query.js';
import { SOURCES, type Source } from '../../sources/source.types.js';

export class ListRunsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(SOURCES)
  source?: Source;
}
