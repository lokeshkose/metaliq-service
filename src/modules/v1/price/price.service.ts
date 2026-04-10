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

import { Price, PriceSchema } from 'src/core/database/mongo/schema/price.schema';

import { PRICE } from './price.constants';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { PriceQueryDto } from './dto/price-query.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';
import * as XLSX from 'xlsx';
import { PriceType } from 'src/shared/enums/product.enums';
import { PriceStatus } from 'src/shared/enums/price.enums';
import { ProductService } from '../product/product.service';

@Injectable()
export class PriceService extends MongoRepository<Price> {
  constructor(
    mongo: MongoService,
    private readonly productService: ProductService,
  ) {
    super(mongo.getModel(Price.name, PriceSchema));
  }

  async create(payload: CreatePriceDto) {
    try {
      return await this.withTransaction(async (session) => {
        const filter: FilterQuery<Price> = {};

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        if (existing && !existing.isDeleted) {
          throw new ConflictException(PRICE.DUPLICATE);
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
            message: PRICE.CREATED,
            data: { priceId: existing.priceId },
          };
        }

        const doc = await this.save(
          {
            priceId: IdGenerator.generate('PRIC', 8),
            ...payload,
          },
          { session },
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: PRICE.CREATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async findAll(query: PriceQueryDto) {
    const { searchText, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Price> = {};

    // if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ priceId: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: PRICE.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  async findByPriceId(priceId: string) {
    const doc = await this.findOne({ priceId }, { lean: true });

    if (!doc) throw new NotFoundException(PRICE.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: PRICE.FETCHED,
      data: doc,
    };
  }

  async update(priceId: string, dto: UpdatePriceDto) {
    try {
      return await this.withTransaction(async (session) => {
        const doc = await this.updateOne({ priceId }, dto, { session, new: true });

        if (!doc) throw new NotFoundException(PRICE.NOT_FOUND);

        return {
          statusCode: HttpStatus.OK,
          message: PRICE.UPDATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async delete(priceId: string) {
    const existing = await this.findOne({ priceId });

    if (!existing) throw new NotFoundException(PRICE.NOT_FOUND);

    await this.softDelete({ priceId });

    return {
      statusCode: HttpStatus.OK,
      message: PRICE.DELETED,
      data: existing,
    };
  }

  async bulkUpload(file: any) {
    /* ======================================================
     * READ EXCEL
     * ====================================================== */
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) {
      throw new BadRequestException('Excel file is empty');
    }

    /* ======================================================
     * HEADER VALIDATION
     * ====================================================== */
    const requiredHeaders = ['productId', 'price'];
    const fileHeaders = Object.keys(rows[0]);

    const missingHeaders = requiredHeaders.filter((h) => !fileHeaders.includes(h));

    if (missingHeaders.length) {
      throw new BadRequestException(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    /* ======================================================
     * FETCH ALL PRODUCTS (OPTIMIZED)
     * ====================================================== */
    const productIds = [...new Set(rows.map((r) => r.productId).filter(Boolean))];

    const products = await this.productService.find(
      { productId: { $in: productIds }, isDeleted: { $ne: true } } as any,
      { lean: true },
    );

    const productMap = new Set(products.map((p) => p.productId));

    /* ======================================================
     * PROCESS ROWS
     * ====================================================== */
    const successData: any[] = [];
    const failedData: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        /* ---------- VALIDATION ---------- */
        if (!row.productId) {
          throw new Error('productId is required');
        }

        if (!productMap.has(row.productId)) {
          throw new Error(`Invalid productId: ${row.productId}`);
        }

        if (!row.price || isNaN(row.price)) {
          throw new Error('price must be a valid number');
        }

        /* ---------- TRANSFORM ---------- */
        const payload = {
          priceId: IdGenerator.generate('PRIC', 8),
          productId: row.productId,
          price: Number(row.price),
          type: row.type || PriceType.STANDARD,
          effectiveAt: row.effectiveAt ? new Date(row.effectiveAt) : new Date(),
          status: PriceStatus.ACTIVE,
        };

        successData.push(payload);
      } catch (error: any) {
        failedData.push({
          row: rowNumber,
          error: error.message,
          data: row,
        });
      }
    }

    /* ======================================================
     * BULK INSERT
     * ====================================================== */
    if (successData.length) {
      try {
        await this.model.insertMany(successData, { ordered: false });
      } catch (error) {
        // ignore duplicate errors
      }
    }

    /* ======================================================
     * RESPONSE
     * ====================================================== */
    return {
      statusCode: HttpStatus.CREATED,
      message: PRICE.BULK_UPLOADED,
      data: {
        total: rows.length,
        success: successData.length,
        failed: failedData.length,
        failedData,
      },
    };
  }

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(PRICE.DUPLICATE);
    }
    throw error;
  }
}
