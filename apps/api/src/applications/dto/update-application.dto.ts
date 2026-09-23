import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string;

  @ValidateIf(
    (_, value) => value !== null && value !== undefined && value !== '',
  )
  @IsUrl()
  @MaxLength(2000)
  url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  notes?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(120)
  salaryText?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(120)
  via?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsISO8601()
  appliedAt?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsISO8601()
  nextStepAt?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @MaxLength(200)
  contactName?: string | null;

  @ValidateIf(
    (_, value) => value !== null && value !== undefined && value !== '',
  )
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string | null;
}
