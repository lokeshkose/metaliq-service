import { ProductStatus } from 'src/shared/enums/product.enums';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export class CreateProductDto {
/**
 * CreateProductDto
 * =================
 * Data Transfer Object for creating new Product records
 */
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ type: String, description: 'Business identifier for Reference' })
  @IsNotEmpty()
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.ACTIVE, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

}
