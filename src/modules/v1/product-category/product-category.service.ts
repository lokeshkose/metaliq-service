import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import {
  ProductCategory,
  ProductCategorySchema,
} from 'src/core/database/mongo/schema/product-category.schema';

import { PRODUCT_CATEGORY } from './product-category.constants';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoryQueryDto } from './dto/product-category-query.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';
import { TextNormalizer } from 'src/shared/utils/text-normalizer.utils';
import { NormalizeType } from 'src/shared/enums/normalize.enums';
import { ProductCategoryStatus } from 'src/shared/enums/product-category.enums';

@Injectable()
export class ProductCategoryService extends MongoRepository<ProductCategory> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(ProductCategory.name, ProductCategorySchema));
  }

  async create(payload: CreateProductCategoryDto) {
    try {
      return await this.withTransaction(async (session) => {
        if (payload.name) {
          payload.name = TextNormalizer.normalize(payload.name, NormalizeType.TITLE);
        }
        const filter: FilterQuery<ProductCategory> = {};

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        if (existing && !existing.isDeleted) {
          throw new ConflictException(PRODUCT_CATEGORY.DUPLICATE);
        }

        if (existing?.isDeleted) {
          await this.updateById(
            existing._id.toString(),
            {
              ...payload,
              status: ProductCategoryStatus.ACTIVE,
              isDeleted: false,
            },
            { session },
          );

          return {
            statusCode: HttpStatus.OK,
            message: PRODUCT_CATEGORY.CREATED,
            data: { categoryId: existing.categoryId },
          };
        }

        const doc = await this.save(
          {
            categoryId: IdGenerator.generate('CAT', 8),
            ...payload,
          },
          { session },
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: PRODUCT_CATEGORY.CREATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async findAll(query: ProductCategoryQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<ProductCategory> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ name: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT_CATEGORY.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  async findByCategoryId(categoryId: string) {
    const doc = await this.findOne({ categoryId }, { lean: true });

    if (!doc) throw new NotFoundException(PRODUCT_CATEGORY.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT_CATEGORY.FETCHED,
      data: doc,
    };
  }

  async update(categoryId: string, dto: UpdateProductCategoryDto) {
    try {
      return await this.withTransaction(async (session) => {
        if (dto.name) {
          dto.name = TextNormalizer.normalize(dto.name, NormalizeType.TITLE);
        }

        const doc = await this.updateOne({ categoryId }, dto, { session, new: true });

        if (!doc) throw new NotFoundException(PRODUCT_CATEGORY.NOT_FOUND);

        return {
          statusCode: HttpStatus.OK,
          message: PRODUCT_CATEGORY.UPDATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async delete(categoryId: string) {
    const existing = await this.findOne({ categoryId });

    if (!existing) throw new NotFoundException(PRODUCT_CATEGORY.NOT_FOUND);

    await this.softDelete({ categoryId });

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT_CATEGORY.DELETED,
      data: existing,
    };
  }

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(PRODUCT_CATEGORY.DUPLICATE);
    }
    throw error;
  }
}
