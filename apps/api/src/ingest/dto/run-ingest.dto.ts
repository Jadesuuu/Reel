import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SOURCES, type Source } from '../../sources/source.types.js';

export class RunIngestDto {
  @IsOptional()
  @IsIn(SOURCES)
  source?: Source;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  boardId?: string;
}
