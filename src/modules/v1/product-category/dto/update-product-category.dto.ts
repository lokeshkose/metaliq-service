import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductCategoryDto } from './create-product-category.dto';

/**
 * UpdateProductCategoryDto
 * =================
 * DTO for updating ProductCategory
 */
export class UpdateProductCategoryDto extends PartialType(
  OmitType(CreateProductCategoryDto, [] as const),
) {}
