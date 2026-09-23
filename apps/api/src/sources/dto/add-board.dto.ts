import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { BOARD_PROVIDERS, type BoardProvider } from '../source.types.js';

export class AddBoardDto {
  @IsIn(BOARD_PROVIDERS)
  provider!: BoardProvider;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  slug!: string;
}
