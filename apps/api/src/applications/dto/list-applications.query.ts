import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.query.js';
import { STAGES, type Stage } from '../stage-machine.js';

export class ListApplicationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(STAGES)
  stage?: Stage;
}
