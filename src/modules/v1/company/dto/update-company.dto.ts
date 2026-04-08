import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

/**
 * UpdateCompanyDto
 * =================
 * DTO for updating Company
 */
export class UpdateCompanyDto extends PartialType(OmitType(CreateCompanyDto, [] as const)) {}
