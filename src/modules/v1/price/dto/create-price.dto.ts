import { PriceType } from 'src/shared/enums/price.enums';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePriceDto {
  /**
   * CreatePriceDto
   * =================
   * Data Transfer Object for creating new Price records
   */
  @ApiProperty({ type: String, description: 'Business identifier for Reference' })
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({
    enum: PriceType,
    example: PriceType.STANDARD,
    default: PriceType.STANDARD,
  })
  @IsOptional()
  @IsEnum(PriceType)
  type?: PriceType;
}
