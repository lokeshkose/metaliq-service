import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInquiryDto } from './create-inquiry.dto';

/**
 * UpdateInquiryDto
 * =================
 * DTO for updating Inquiry
 */
export class UpdateInquiryDto extends PartialType(OmitType(CreateInquiryDto, [] as const)) {}
