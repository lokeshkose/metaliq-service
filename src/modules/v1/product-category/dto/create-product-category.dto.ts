import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, ValidateIf } from 'class-validator';
import { ProductCategoryTypes } from 'src/shared/enums/product-category.enums';

export class CreateProductCategoryDto {
  /**
   * DTO for creating ProductCategory
   */

  @ApiPropertyOptional({ type: String })
  @ValidateIf((o) => o.type === ProductCategoryTypes.CHILD)
  @IsNotEmpty({ message: 'parentId is required when type is CHILD' })
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ type: String })
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: ProductCategoryTypes,
    example: ProductCategoryTypes.PARENT,
    default: ProductCategoryTypes.PARENT,
  })
  @IsNotEmpty()
  @IsEnum(ProductCategoryTypes)
  type?: ProductCategoryTypes;
}
