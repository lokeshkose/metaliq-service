import { CompanyStatus } from 'src/shared/enums/company.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsArray, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * CompanyQueryDto
 * =================
 * DTO for querying Company
 */
export class CompanyQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search text', example: 'abc' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  courses?: string[];

  @ApiPropertyOptional({ enum: CompanyStatus })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}
