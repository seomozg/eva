import { IsString, IsOptional } from 'class-validator';

export class CreateGirlDto {
  @IsString()
  name: string;

  @IsString()
  appearance: string;

  @IsString()
  personality: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}