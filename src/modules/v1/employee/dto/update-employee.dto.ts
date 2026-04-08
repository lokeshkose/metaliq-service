import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

/**
 * UpdateEmployeeDto
 * =================
 * DTO for updating Employee
 */
export class UpdateEmployeeDto extends PartialType(OmitType(CreateEmployeeDto, [] as const)) {}
