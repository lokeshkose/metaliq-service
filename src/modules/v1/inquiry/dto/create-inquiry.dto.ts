import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { InquiryStatus } from 'src/shared/enums/inquiry.enums';

export class CreateInquiryDto {
  /**
   * CreateInquiryDto
   * =================
   * DTO for creating Inquiry
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  customerPrice?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  customerQuantity?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comments?: string;
}
