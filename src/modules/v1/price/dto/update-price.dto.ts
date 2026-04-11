import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePriceDto } from './create-price.dto';

/**
 * UpdateEmployeeDto
 * =================
 * DTO for updating Employee
 */
export class UpdatePriceDto extends PartialType(OmitType(CreatePriceDto, [] as const)) {}
