import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UnlockPromptDto {
  @ApiProperty({ description: 'Ad completion token from frontend' })
  @IsString()
  @IsNotEmpty()
  adToken: string;
}

export class UnlockIntentResponseDto {
  @ApiProperty({ description: 'Token to use for ad verification' })
  token: string;
}

export class UnlockResponseDto {
  @ApiProperty({ description: 'Whether unlock was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Message if unlock failed' })
  message?: string;
}