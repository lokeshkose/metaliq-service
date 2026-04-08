import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ProductCategory,
  ProductCategorySchema,
} from 'src/core/database/mongo/schema/product-category.schema';
import { ProductCategoryController } from './product-category.controller';
import { ProductCategoryService } from './product-category.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProductCategory.name, schema: ProductCategorySchema }]),
  ],
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService],
  exports: [ProductCategoryService],
})
export class ProductCategoryModule {}
