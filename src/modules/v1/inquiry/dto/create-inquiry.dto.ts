import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDate,
  Min,
  Length,
} from 'class-validator';
import { InquiryStatus } from 'src/shared/enums/inquiry.enums';

export class CreateInquiryDto {
  /* ======================================================
   * PRODUCT
   * ====================================================== */

  @ApiProperty({ example: 'PROD001', type: String })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  productId!: string;

  @ApiProperty({ example: 'Apple', type: String })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  productName!: string;

  /* ======================================================
   * CUSTOMER
   * ====================================================== */

  @ApiProperty({ example: 'CUST001', type: String })
  @IsNotEmpty()
  @IsString()
  customerId!: string;

  @ApiProperty({ example: 'John Doe', type: String })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  customerName!: string;

  /* ======================================================
   * INQUIRY DETAILS
   * ====================================================== */

  @ApiProperty({ example: 'Bulk purchase requirement', type: String })
  @IsNotEmpty()
  @IsString()
  @Length(3, 200)
  purpose!: string;

  /* ======================================================
   * PRICING
   * ====================================================== */

  @ApiProperty({ example: 100, type: Number })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiProperty({ example: 5000, type: Number })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  estimatedValue!: number;

  @ApiProperty({ example: 120, type: Number })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  customerPrice!: number;

  @ApiPropertyOptional({ example: 110, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offeredPrice?: number;

  @ApiPropertyOptional({ example: 110, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalOfferedAmount?: number;

  @ApiPropertyOptional({ example: 110, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  availabledStock?: number;

  @ApiPropertyOptional({ example: '3-4 Days', type: String })
  @IsOptional()
  @IsString()
  estimatedDeliveryDays?: string;

  /* ======================================================
   * QUANTITY
   * ====================================================== */

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  customerQuantity!: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  offeredQuantity?: number;

  /* ======================================================
   * OTHER INFO
   * ====================================================== */

  @ApiPropertyOptional({ example: 'Urgent requirement' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  remark?: string;

  @ApiPropertyOptional({ example: 'Customer prefers fast delivery' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  comments?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  deliveryCity!: string;

  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  deliveryRequiredBy!: Date;

  /* ======================================================
   * STATUS
   * ====================================================== */

  @ApiPropertyOptional({ enum: InquiryStatus })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;
}
