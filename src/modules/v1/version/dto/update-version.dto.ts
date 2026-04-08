import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateVersionDto } from './create-version.dto';

/**
 * UpdateVersionDto
 * =================
 * DTO for updating Version
 */
export class UpdateVersionDto extends PartialType(OmitType(CreateVersionDto, [] as const)) {}
