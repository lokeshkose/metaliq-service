import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  IsEnum,
  ValidateNested,
  Matches,
  Length,
  IsEmail,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from 'src/shared/enums/employee.enums';

/* ======================================================
 * PERMISSION OVERRIDES DTO
 * ====================================================== */
export class PermissionOverridesDto {
  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allow?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  deny?: string[];
}

/* ======================================================
 * CREATE EMPLOYEE DTO
 * ====================================================== */
export class CreateEmployeeDto {
  /**
   * DTO for creating Employee
   */

  @ApiProperty({ example: '9876543210', required: true })
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile must be a valid 10-digit Indian number',
  })
  mobile!: string;

  @ApiProperty({ example: 'Lokesh Kose', required: true })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiProperty({ example: 'Strong@123', required: true })
  @IsNotEmpty()
  @Length(6, 20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message: 'Password must contain at least 1 letter, 1 number, and 1 special character',
  })
  password!: string;

  @ApiPropertyOptional({ example: 'lokesh@gmail.com', default: null })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({ example: 'ROLE001', required: true })
  @IsNotEmpty()
  @IsString()
  roleId!: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, enumName: 'EmployeeStatus' })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ type: () => PermissionOverridesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionOverridesDto)
  permissionOverrides?: PermissionOverridesDto;
}
