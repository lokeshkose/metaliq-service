import { ProductCategoryStatus } from 'src/shared/enums/product-category.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * ProductCategoryQueryDto
 * =================
 * DTO for querying ProductCategory
 */
export class ProductCategoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search text', example: 'abc' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ProductCategoryStatus })
  @IsOptional()
  @IsEnum(ProductCategoryStatus)
  status?: ProductCategoryStatus;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
