import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Price, PriceSchema } from 'src/core/database/mongo/schema/price.schema';

import { PRICE } from './price.constants';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { PriceQueryDto } from './dto/price-query.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';

@Injectable()
export class PriceService extends MongoRepository<Price> {
  constructor(mongo: MongoService) {
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

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(PRICE.DUPLICATE);
    }
    throw error;
  }
}
