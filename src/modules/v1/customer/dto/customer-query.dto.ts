import { CustomerStatus } from 'src/shared/enums/customer.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * CustomerQueryDto
 * =================
 * DTO for querying Customer
 */
export class CustomerQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search text', example: 'abc' })
  @IsOptional()
  @IsString()
  // @MinLength(2)
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
