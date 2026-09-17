import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { STAGES, type Stage } from '../stage-machine.js';

export class ChangeStageDto {
  @IsIn(STAGES)
  to!: Stage;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
