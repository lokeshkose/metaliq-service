import { ProductStatus } from 'src/shared/enums/product.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * ProductQueryDto
 * =================
 * Data Transfer Object for querying Product records
 * 
 * All fields are optional - supports partial matching and range queries
 * Extends PaginationDto for pagination support
 */
export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Search by name, code, or identifier (supports partial matching)", example: "search term" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ type: String, description: 'Business identifier for product' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String, description: 'Array of Reference IDs' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  /**
   * Status
   * ------
   * Filter by record status (e.g., ACTIVE, INACTIVE, PENDING, DELETED)
   */
  @ApiPropertyOptional({ description: "Filter by status", example: "ACTIVE" })
  @IsOptional()
  status?: ProductStatus;

}