import { ProductStatus } from 'src/shared/enums/product.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';


export class UpdateProductDto {
/**
 * UpdateProductDto
 * =================
 * Data Transfer Object for updating Product records
 * 
 * All fields are optional for partial updates
 * Supports partial updates - omitted fields will retain their existing values
 */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String, description: 'Array of Reference IDs' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

}
