import { EmployeeStatus } from 'src/shared/enums/employee.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * EmployeeQueryDto
 * =================
 * DTO for querying Employee
 */
export class EmployeeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search text', example: 'abc' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  mobile?: string;

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
  roleId?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
