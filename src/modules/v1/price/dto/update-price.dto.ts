import { PriceType } from 'src/shared/enums/price.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePriceDto {
  /**
   * UpdatePriceDto
   * =================
   * Data Transfer Object for updating Price records
   *
   * All fields are optional for partial updates
   * Supports partial updates - omitted fields will retain their existing values
   */
  @ApiPropertyOptional({ type: String, description: 'Array of Reference IDs' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: PriceType, default: PriceType.STANDARD })
  @IsOptional()
  @IsEnum(PriceType)
  type?: PriceType;
}
