import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class RatePromptDto {
  @ApiProperty({ description: 'Rating from 1 to 5', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}

export class RatingResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  promptSlug: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  createdAt: Date;
}

export class AverageRatingDto {
  @ApiProperty()
  promptSlug: string;

  @ApiPropertyOptional()
  averageRating?: number;

  @ApiPropertyOptional()
  totalRatings?: number;
}