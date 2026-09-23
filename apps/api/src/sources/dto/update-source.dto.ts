import { IsBoolean } from 'class-validator';

export class UpdateSourceDto {
  @IsBoolean()
  enabled!: boolean;
}
