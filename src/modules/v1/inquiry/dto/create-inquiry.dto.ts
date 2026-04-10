import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsDate } from 'class-validator';
import { InquiryStatus } from 'src/shared/enums/inquiry.enums';

export class CreateInquiryDto {
  /**
   * CreateInquiryDto
   * =================
   * DTO for creating Inquiry
   */
  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  customerPrice?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  customerQuantity?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  remark?: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // comments?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  deliveryCity?: string;

  @ApiProperty({ type: Date })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  deliveryRequiredBy!: Date;
}
