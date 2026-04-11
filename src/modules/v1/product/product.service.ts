import {
  Injectable,
  NotFoundException,
  ConflictException,
  HttpStatus,
  BadRequestException,
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
import { ProductStatus } from 'src/shared/enums/product.enums';

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
        const filter: FilterQuery<Product> = {
          name: payload.name,
          categoryId: payload.categoryId,
        };

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
              status: ProductStatus.ACTIVE,
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
      filter.$or = [{ name: regex }];
    }

    const skip = (page - 1) * limit;

    const data = await this.model.aggregate([
      { $match: filter },

      /* =========================
       * PRICE LOOKUP (LAST 2)
       * ========================= */
      {
        $lookup: {
          from: 'price_master',
          let: { productId: '$productId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $lte: ['$effectiveAt', new Date()] }, // ✅ KEY FIX
                  ],
                },
              },
            },
            { $sort: { effectiveAt: -1, _id: -1 } },
            { $limit: 2 },
          ],
          as: 'priceData',
        },
      },

      /* =========================
       * PRICE CALCULATION
       * ========================= */
      {
        $addFields: {
          currentPrice: {
            $ifNull: [{ $arrayElemAt: ['$priceData.price', 0] }, 0],
          },
          previousPrice: {
            $arrayElemAt: ['$priceData.price', 1],
          },
        },
      },
      {
        $addFields: {
          priceDifference: {
            $cond: [
              { $ne: ['$previousPrice', null] },
              { $subtract: ['$currentPrice', '$previousPrice'] },
              null,
            ],
          },
          hasPrice: {
            $gt: [{ $size: '$priceData' }, 0],
          },
        },
      },

      /* =========================
       * CATEGORY LOOKUP
       * ========================= */
      {
        $lookup: {
          from: 'product_categories',
          localField: 'categoryId',
          foreignField: 'categoryId',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },

      /* =========================
       * PARENT CATEGORY LOOKUP
       * ========================= */
      {
        $lookup: {
          from: 'product_categories',
          localField: 'category.parentId',
          foreignField: 'categoryId',
          as: 'parentCategory',
        },
      },
      {
        $unwind: {
          path: '$parentCategory',
          preserveNullAndEmptyArrays: true,
        },
      },

      /* =========================
       * FINAL STRUCTURE
       * ========================= */
      {
        $addFields: {
          'category.parent': '$parentCategory',
        },
      },

      {
        $project: {
          priceData: 0,
          parentCategory: 0,
          hasPrice: 0,
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await this.model.countDocuments(filter);

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT.FETCHED,
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findByProductId(productId: string) {
    // const result = await this.model.aggregate([
    //   { $match: { productId } },

    //   /* PRICE */
    //   {
    //     $lookup: {
    //       from: 'price_master',
    //       let: { productId: '$productId' },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: { $eq: ['$productId', '$$productId'] },
    //           },
    //         },
    //         { $sort: { effectiveAt: -1 } },
    //         { $limit: 1 },
    //       ],
    //       as: 'priceData',
    //     },
    //   },
    //   {
    //     $addFields: {
    //       price: { $arrayElemAt: ['$priceData.price', 0] },
    //     },
    //   },

    //   /* CATEGORY */
    //   {
    //     $lookup: {
    //       from: 'product_category',
    //       localField: 'categoryId',
    //       foreignField: 'categoryId',
    //       as: 'category',
    //     },
    //   },
    //   { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

    //   /* PARENT CATEGORY */
    //   {
    //     $lookup: {
    //       from: 'product_category',
    //       localField: 'category.parentId',
    //       foreignField: 'categoryId',
    //       as: 'parentCategory',
    //     },
    //   },
    //   { $unwind: { path: '$parentCategory', preserveNullAndEmptyArrays: true } },

    //   {
    //     $addFields: {
    //       'category.parent': '$parentCategory',
    //     },
    //   },
    //   {
    //     $project: {
    //       priceData: 0,
    //       parentCategory: 0,
    //     },
    //   },
    // ]);

    const result = await this.model.aggregate([
      { $match: { productId } },

      /* =========================
       * PRICE LOOKUP (LAST 2)
       * ========================= */
      {
        $lookup: {
          from: 'price_master',
          let: { productId: '$productId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $lte: ['$effectiveAt', new Date()] }, // ✅ KEY FIX
                  ],
                },
              },
            },
            { $sort: { effectiveAt: -1, _id: -1 } },
            { $limit: 2 },
          ],
          as: 'priceData',
        },
      },

      /* =========================
       * PRICE CALCULATION
       * ========================= */
      {
        $addFields: {
          currentPrice: {
            $ifNull: [{ $arrayElemAt: ['$priceData.price', 0] }, 0],
          },
          previousPrice: {
            $arrayElemAt: ['$priceData.price', 1],
          },
        },
      },
      {
        $addFields: {
          priceDifference: {
            $cond: [
              { $ne: ['$previousPrice', null] },
              { $subtract: ['$currentPrice', '$previousPrice'] },
              null,
            ],
          },
          hasPrice: {
            $gt: [{ $size: '$priceData' }, 0],
          },
        },
      },

      /* =========================
       * CATEGORY LOOKUP
       * ========================= */
      {
        $lookup: {
          from: 'product_categories',
          localField: 'categoryId',
          foreignField: 'categoryId',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },

      /* =========================
       * PARENT CATEGORY LOOKUP
       * ========================= */
      {
        $lookup: {
          from: 'product_categories',
          localField: 'category.parentId',
          foreignField: 'categoryId',
          as: 'parentCategory',
        },
      },
      {
        $unwind: {
          path: '$parentCategory',
          preserveNullAndEmptyArrays: true,
        },
      },

      /* =========================
       * FINAL STRUCTURE
       * ========================= */
      {
        $addFields: {
          'category.parent': '$parentCategory',
        },
      },

      {
        $project: {
          priceData: 0,
          parentCategory: 0,
          hasPrice: 0,
        },
      },
    ]);

    if (!result.length) {
      throw new NotFoundException(PRODUCT.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: PRODUCT.FETCHED,
      data: result[0],
    };
  }

  async update(productId: string, dto: UpdateProductDto) {
    try {
      return await this.withTransaction(async (session) => {
        /* ======================================================
         * NORMALIZE NAME
         * ====================================================== */
        if (dto.name) {
          dto.name = TextNormalizer.normalize(dto.name, NormalizeType.TITLE);
        }

        /* ======================================================
         * DUPLICATE CHECK (name + categoryId)
         * ====================================================== */
        if (dto.name || dto.categoryId) {
          const existing = await this.model.findOne(
            {
              name: dto.name,
              categoryId: dto.categoryId,
              productId: { $ne: productId }, // exclude current product
              isDeleted: { $ne: true },
            },
            null,
            { session },
          );

          if (existing) {
            throw new BadRequestException(PRODUCT.DUPLICATE);
          }
        }

        /* ======================================================
         * UPDATE
         * ====================================================== */
        const doc = await this.updateOne({ productId }, dto, { session, new: true });

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
