import { PriceType } from 'src/shared/enums/price.enums';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceDto {
  /**
   * CreatePriceDto
   * =================
   * Data Transfer Object for creating new Price records
   */

  /* ======================================================
   * PRODUCT
   * ====================================================== */

  @ApiProperty({
    example: 'PROD001',
    description: 'Product identifier',
  })
  @IsNotEmpty()
  @IsString()
  productId!: string;

  /* ======================================================
   * PRICE
   * ====================================================== */

  @ApiProperty({
    example: 100,
    description: 'Price value',
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  price!: number;

  /* ======================================================
   * TYPE
   * ====================================================== */

  @ApiPropertyOptional({
    enum: PriceType,
    example: PriceType.STANDARD,
    default: PriceType.STANDARD,
  })
  @IsOptional()
  @IsEnum(PriceType)
  type?: PriceType;

  /* ======================================================
   * EFFECTIVE DATE
   * ====================================================== */

  @ApiProperty({
    example: '2026-04-15T00:00:00.000Z',
    description: 'Effective date of price',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  effectiveAt!: Date;
}
