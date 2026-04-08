import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

/**
 * UpdateCustomerDto
 * =================
 * DTO for updating Customer
 */
export class UpdateCustomerDto extends PartialType(OmitType(CreateCustomerDto, [] as const)) {}
