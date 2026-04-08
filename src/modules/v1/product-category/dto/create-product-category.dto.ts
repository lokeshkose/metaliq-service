import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ProductCategoryStatus } from 'src/shared/enums/product-category.enums';

export class CreateProductCategoryDto {
  /**
   * CreateProductCategoryDto
   * =================
   * DTO for creating ProductCategory
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ProductCategoryStatus, enumName: 'ProductCategoryStatus' })
  @IsOptional()
  @IsEnum(ProductCategoryStatus)
  status?: ProductCategoryStatus;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
