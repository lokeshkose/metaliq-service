import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  Length,
  ValidateNested,
} from 'class-validator';
import { CompanyStatus } from 'src/shared/enums/company.enums';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ example: '123 Main Street', required: true })
  @IsNotEmpty()
  @IsString()
  @Length(3, 150)
  line1!: string;

  @ApiPropertyOptional({ example: 'Near Metro Station', default: null })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  line2?: string;
}

export class CreateCompanyDto {
  /**
   * CreateCompanyDto
   * =================
   * DTO for creating Company
   */
  @ApiPropertyOptional({ type: String, required: true })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: String, required: true })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ type: String, required: true })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ type: String, default: null })
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

  @ApiPropertyOptional({
    enum: CompanyStatus,
    enumName: 'CompanyStatus',
    default: CompanyStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  /* ======================================================
   * ADDRESS (NEW)
   * ====================================================== */

  @ApiProperty({ type: () => AddressDto, required: true })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
