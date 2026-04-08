
import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Product, ProductSchema } from 'src/core/database/mongo/schema/product.schema';

import { PRODUCT } from './product.constants';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';
import { TextNormalizer } from 'src/shared/utils/text-normalizer.utils';
import { NormalizeType } from 'src/shared/enums/normalize.enums';

@Injectable()
export class ProductService extends MongoRepository<Product> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(Product.name, ProductSchema));
  }

  async create(payload: CreateProductDto) {
    try {
      return await this.withTransaction(async (session) => {
        if (payload.name) {
          payload.name = TextNormalizer.normalize(payload.name, NormalizeType.TITLE);
        }
        const filter: FilterQuery<Product> = {};

        

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        if (existing && !existing.isDeleted) {
          throw new ConflictException(PRODUCT.DUPLICATE);
        }

        if (existing?.isDeleted) {
          await this.updateById(
            existing._id.toString(),
            {
              ...payload,
              status: 'ACTIVE',
              isDeleted: false,
            },
            { session },
          );

          return {
            statusCode: HttpStatus.OK,
            message: PRODUCT.CREATED,
            data: { productId: existing.productId },
          };
        }

        const doc = await this.save(
          {
            productId: IdGenerator.generate('PROD', 8),
            ...payload,
          },
          { session },
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: PRODUCT.CREATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async findAll(query: ProductQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Product> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ productId: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  async findByProductId(productId: string) {
    const doc = await this.findOne({ productId }, { lean: true });

    if (!doc) throw new NotFoundException(PRODUCT.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT.FETCHED,
      data: doc,
    };
  }

  async update(productId: string, dto: UpdateProductDto) {
    try {
      return await this.withTransaction(async (session) => {
        if (dto.name) {
          dto.name = TextNormalizer.normalize(dto.name, NormalizeType.TITLE);
        }

        const doc = await this.updateOne(
          { productId },
          dto,
          { session, new: true },
        );

        if (!doc) throw new NotFoundException(PRODUCT.NOT_FOUND);

        return {
          statusCode: HttpStatus.OK,
          message: PRODUCT.UPDATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async delete(productId: string) {
    const existing = await this.findOne({ productId });

    if (!existing) throw new NotFoundException(PRODUCT.NOT_FOUND);

    await this.softDelete({ productId });

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT.DELETED,
      data: existing,
    };
  }

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(PRODUCT.DUPLICATE);
    }
    throw error;
  }
}
