import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * UpdateProductDto
 * =================
 * DTO for updating Employee
 */
export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, [] as const)) {}
