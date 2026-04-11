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
import { FileType, ProductStatus } from 'src/shared/enums/product.enums';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
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
          priceEffectiveAt: {
            $ifNull: [{ $arrayElemAt: ['$priceData.effectiveAt', 0] }, 0],
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
          priceEffectiveAt: {
            $ifNull: [{ $arrayElemAt: ['$priceData.effectiveAt', 0] }, 0],
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

  async exportProducts(query: ProductQueryDto, res: any) {
    const result = await this.findAll({
      ...query,
    });

    const data = result.data;

    if (query.fileType === FileType.PDF) {
      return this.exportPDF(data, res);
    }

    return this.exportExcel(data, res);
  }

  async exportExcel(data: any[], res: Response) {
    const fileName = `products-${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
    });

    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: 'Product Name', key: 'productName', width: 25 },
      { header: 'Product ID', key: 'productId', width: 25 },
      { header: 'Parent Category', key: 'parentCategory', width: 20 },
      { header: 'Sub Category', key: 'subCategory', width: 20 },
      { header: 'Current Price', key: 'currentPrice', width: 15 },
      { header: 'Previous Price', key: 'previousPrice', width: 15 },
      { header: 'Last Price Update Date', key: 'priceEffectiveAt', width: 18 },
      { header: 'New Price', key: 'newPrice', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const item of data) {
      worksheet
        .addRow({
          productName: item.name,
          productId: item.productId,
          parentCategory: item.category?.parent?.name || '',
          subCategory: item.category?.name || '',
          currentPrice: item.currentPrice ?? 0,
          previousPrice: item.previousPrice ?? 0,
          priceEffectiveAt: item.priceEffectiveAt ?? 0,
          newPrice: '',
        })
        .commit();
    }

    worksheet.commit();
    await workbook.commit();
  }

  async exportPDF(data: any[], res: Response) {
    const fileName = `products-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    doc.pipe(res);

    /* ======================================================
     * TITLE
     * ====================================================== */
    doc.fontSize(16).text('Product List', { align: 'center' });
    doc.moveDown();

    /* ======================================================
     * TABLE CONFIG
     * ====================================================== */
    const tableTop = doc.y;
    const rowPadding = 5;

    const columns = [
      { header: 'Product', key: 'name', width: 90 },
      { header: 'ID', key: 'productId', width: 70 },
      { header: 'Parent', key: 'parent', width: 70 },
      { header: 'Sub', key: 'sub', width: 70 },
      { header: 'Curr', key: 'currentPrice', width: 50 },
      { header: 'Prev', key: 'previousPrice', width: 50 },
      { header: 'Price Updated', key: 'date', width: 80 },
    ];

    let startX = 30;
    let y = tableTop;

    /* ======================================================
     * DRAW HEADER
     * ====================================================== */
    doc.font('Helvetica-Bold').fontSize(9);

    let x = startX;

    columns.forEach((col) => {
      doc.rect(x, y, col.width, 20).stroke(); // border

      doc.text(col.header, x + 2, y + 5, {
        width: col.width - 4,
        align: 'left',
      });

      x += col.width;
    });

    y += 20;
    doc.font('Helvetica');

    /* ======================================================
     * ROWS
     * ====================================================== */
    data.forEach((item) => {
      const rowData = [
        item.name || '',
        item.productId || '',
        item.category?.parent?.name || '',
        item.category?.name || '',
        String(item.currentPrice ?? 0),
        String(item.previousPrice ?? 0),
        item.priceEffectiveAt ? new Date(item.priceEffectiveAt).toLocaleDateString('en-GB') : '',
      ];

      /* =========================
       * CALCULATE MAX HEIGHT
       * ========================= */
      let maxHeight = 0;

      rowData.forEach((text, i) => {
        const colWidth = columns[i].width - 4;

        const height = doc.heightOfString(text, {
          width: colWidth,
        });

        if (height > maxHeight) maxHeight = height;
      });

      const rowHeight = maxHeight + rowPadding * 2;

      /* =========================
       * PAGE BREAK
       * ========================= */
      if (y + rowHeight > 800) {
        doc.addPage();
        y = 30;
      }

      /* =========================
       * DRAW CELLS
       * ========================= */
      x = startX;

      rowData.forEach((text, i) => {
        const colWidth = columns[i].width;

        // border
        doc.rect(x, y, colWidth, rowHeight).stroke();

        // text (wrapped)
        doc.text(text, x + 2, y + rowPadding, {
          width: colWidth - 4,
          align: 'left',
        });

        x += colWidth;
      });

      y += rowHeight;
    });

    /* ======================================================
     * FINALIZE
     * ====================================================== */
    doc.end();
  }

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(PRODUCT.DUPLICATE);
    }
    throw error;
  }
}
