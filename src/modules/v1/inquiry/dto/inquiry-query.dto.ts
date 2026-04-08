import { InquiryStatus } from 'src/shared/enums/inquiry.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsNumber, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * InquiryQueryDto
 * =================
 * DTO for querying Inquiry
 */
export class InquiryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search text', example: 'abc' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  searchText?: string;

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

  @ApiPropertyOptional({ enum: InquiryStatus })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;
}
