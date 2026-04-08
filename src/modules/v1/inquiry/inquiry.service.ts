import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Inquiry, InquirySchema } from 'src/core/database/mongo/schema/inquiry.schema';

import { INQUIRY } from './inquiry.constants';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { InquiryQueryDto } from './dto/inquiry-query.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';

@Injectable()
export class InquiryService extends MongoRepository<Inquiry> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(Inquiry.name, InquirySchema));
  }

  async create(payload: CreateInquiryDto) {
    try {
      return await this.withTransaction(async (session) => {
        const filter: FilterQuery<Inquiry> = {};

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        if (existing && !existing.isDeleted) {
          throw new ConflictException(INQUIRY.DUPLICATE);
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
            message: INQUIRY.CREATED,
            data: { inquiryId: existing.inquiryId },
          };
        }

        const doc = await this.save(
          {
            inquiryId: IdGenerator.generate('INQU', 8),
            ...payload,
          },
          { session },
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: INQUIRY.CREATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async findAll(query: InquiryQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Inquiry> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ inquiryId: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: INQUIRY.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  async findByInquiryId(inquiryId: string) {
    const doc = await this.findOne({ inquiryId }, { lean: true });

    if (!doc) throw new NotFoundException(INQUIRY.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: INQUIRY.FETCHED,
      data: doc,
    };
  }

  async update(inquiryId: string, dto: UpdateInquiryDto) {
    try {
      return await this.withTransaction(async (session) => {
        const doc = await this.updateOne({ inquiryId }, dto, { session, new: true });

        if (!doc) throw new NotFoundException(INQUIRY.NOT_FOUND);

        return {
          statusCode: HttpStatus.OK,
          message: INQUIRY.UPDATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async delete(inquiryId: string) {
    const existing = await this.findOne({ inquiryId });

    if (!existing) throw new NotFoundException(INQUIRY.NOT_FOUND);

    await this.softDelete({ inquiryId });

    return {
      statusCode: HttpStatus.OK,
      message: INQUIRY.DELETED,
      data: existing,
    };
  }

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(INQUIRY.DUPLICATE);
    }
    throw error;
  }
}
