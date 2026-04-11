import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';

/**
 * UpdateCompanyDto
 * =================
 * DTO for updating Company
 */
export class UpdateDeviceDto extends PartialType(OmitType(CreateDeviceDto, [] as const)) {}
