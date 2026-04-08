import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { CompanyStatus } from 'src/shared/enums/company.enums';

export class CreateCompanyDto {
  /**
   * CreateCompanyDto
   * =================
   * DTO for creating Company
   */
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

  @ApiPropertyOptional({ enum: CompanyStatus, enumName: 'CompanyStatus' })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}
