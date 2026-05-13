import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsBoolean, IsNumber, IsUUID, Min, Max } from 'class-validator';

export class CreatePromptDto {
  @ApiProperty({ example: 'My Awesome Prompt' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Array of category UUIDs', example: ['uuid1', 'uuid2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds: string[];

  @ApiProperty({ 
    description: 'Prompt content object with tier keys',
    example: { starter: 'Starter prompt...', builder: 'Builder prompt...' }
  })
  @IsOptional()
  content?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Is multi-version prompt' })
  @IsOptional()
  @IsBoolean()
  isMultiVersion?: boolean;

  @ApiPropertyOptional({ example: 'marketing' })
  @IsOptional()
  @IsString()
  primaryTag?: string;

  @ApiPropertyOptional({ example: 'copywriting, sales' })
  @IsOptional()
  @IsString()
  secondaryTags?: string;
}

export class UpdatePromptDto extends PartialType(
  OmitType(CreatePromptDto, ['categoryIds'] as const)
) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isMultiVersion?: boolean;
}

export class PromptContentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [String] })
  categoryNames: string[];

  @ApiProperty({ type: [String] })
  tagNames: string[];

  @ApiProperty()
  preview: string;

  @ApiPropertyOptional()
  content?: Record<string, string>;

  @ApiProperty()
  isViral: boolean;

  @ApiProperty()
  isNano: boolean;

  @ApiPropertyOptional()
  tier: string | null;

  @ApiProperty()
  views: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

export class PromptListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category name' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by tag name' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Search prompts by title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by tier: starter, builder, pro, super' })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ description: 'Sort by: newest, oldest, popular' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Comma-separated fields to return' })
  @IsOptional()
  @IsString()
  fields?: string;
}