import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Length,
  Matches,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { CustomerStatus } from 'src/shared/enums/customer.enums';

export class AddressDto {
  @ApiProperty({ example: '123 Main Street', required: true })
  @IsNotEmpty()
  @IsString()
  @Length(3, 150)
  line1!: string;

  @ApiPropertyOptional({ example: 'Near Metro Station' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  line2?: string;
}

export class CreateCustomerDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  roleId!: string;

  @ApiProperty({ example: 'Lokesh', required: true })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  firstName!: string;

  @ApiProperty({ example: 'Kose', required: true })
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  lastName!: string;

  @ApiPropertyOptional({ example: 'lokesh@gmail.com', required: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({ example: '9876543210', required: true })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile must be a valid 10-digit Indian number',
  })
  mobile!: string;

  @ApiPropertyOptional({ example: '27ABCDE1234F1Z5', default: null })
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GST number',
  })
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'ABC Pvt Ltd', default: null })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  companyName?: string;

  @ApiProperty({ example: 'Strong@123', required: true })
  @IsNotEmpty()
  @Length(6, 20)
  password!: string;

  /* ======================================================
   * STATUS
   * ====================================================== */

  @ApiPropertyOptional({ enum: CustomerStatus, enumName: 'CustomerStatus' })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  /* ======================================================
   * ADDRESS (NEW)
   * ====================================================== */

  @ApiProperty({ type: () => AddressDto, required: true })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
