import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsArray, IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from 'src/shared/enums/employee.enums';

export class PermissionOverridesDto {
  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allow?: string[];

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deny?: string[];
}

export class CreateEmployeeDto {
  /**
   * CreateEmployeeDto
   * =================
   * DTO for creating Employee
   */
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  mobile!: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ type: String })
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
