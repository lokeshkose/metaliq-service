import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { CustomerStatus } from 'src/shared/enums/customer.enums';

export class CreateCustomerDto {
  /**
   * CreateCustomerDto
   * =================
   * DTO for creating Customer
   */
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  roleId!: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  mobile!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiProperty({ enum: CustomerStatus, enumName: 'CustomerStatus' })
  @IsNotEmpty()
  @IsEnum(CustomerStatus)
  status!: CustomerStatus;
}
