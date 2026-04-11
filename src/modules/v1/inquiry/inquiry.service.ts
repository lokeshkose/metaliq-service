import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Inquiry, InquirySchema } from 'src/core/database/mongo/schema/inquiry.schema';

import { INQUIRY } from './inquiry.constants';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { InquiryQueryDto } from './dto/inquiry-query.dto';
import { InquiryStatus } from 'src/shared/enums/inquiry.enums';

@Injectable()
export class InquiryService extends MongoRepository<Inquiry> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(Inquiry.name, InquirySchema));
  }

  async create(payload: CreateInquiryDto) {
    try {
      const { productId, customerId, customerPrice, customerQuantity } = payload;
      return await this.withTransaction(async (session) => {
        const filter: FilterQuery<Inquiry> = {
          productId,
          customerId,
          customerPrice,
          customerQuantity,
        };

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
              status: InquiryStatus.PENDING,
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

        const count = await this.countDocuments({}, { session });

        const doc = await this.save(
          {
            inquiryId: `INQ${String(count + 1).padStart(5, '0')}`,
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

    const match: any = {};

    if (status) match.status = status;

    if (query.customerId) {
      match.customerId = query.customerId;
    }

    if (searchText) {
      const regex = new RegExp(searchText, 'i');

      match.$or = [{ inquiryId: regex }, { customerName: regex }];
    }

    const skip = (page - 1) * limit;

    const data = await this.model.aggregate([
      { $match: match },

      { $sort: { createdAt: -1 } },

      { $skip: skip },
      { $limit: limit },

      /* ======================================================
       * 🔗 TIMELINE (AUDIT LOGS JOIN)
       * ====================================================== */
      {
        $lookup: {
          from: 'audit_logs',
          let: { inquiryId: '$inquiryId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$entityId', '$$inquiryId'] }, { $eq: ['$entity', 'inquires'] }],
                },
              },
            },
            { $sort: { createdAt: 1 } },

            /* Optional: limit timeline size */
            { $limit: 10 },

            /* Optional: clean response */
            {
              $project: {
                action: 1,
                before: 1,
                after: 1,
                performedBy: 1,
                metadata: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'timeline',
        },
      },
    ]);

    const total = await this.model.countDocuments(match);

    return {
      statusCode: HttpStatus.OK,
      message: INQUIRY.FETCHED,
      data,
      meta: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit,
      },
    };
  }

  async findByInquiryId(inquiryId: string) {
    const result = await this.model.aggregate([
      {
        $match: { inquiryId },
      },

      { $limit: 1 },

      /* ======================================================
       * 👤 CUSTOMER LOOKUP
       * ====================================================== */
      {
        $lookup: {
          from: 'customer_master', // ⚠️ make sure this is correct
          localField: 'customerId',
          foreignField: 'customerId',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
        },
      },

      /* ======================================================
       * 🔗 TIMELINE (AUDIT LOGS)
       * ====================================================== */
      {
        $lookup: {
          from: 'audit_logs',
          let: { inquiryId: '$inquiryId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$entityId', '$$inquiryId'] },
                    { $eq: ['$entity', 'inquires'] }, // ⚠️ typo? should be 'inquiries'?
                  ],
                },
              },
            },
            { $sort: { createdAt: 1 } },
            {
              $project: {
                action: 1,
                before: 1,
                after: 1,
                performedBy: 1,
                metadata: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'timeline',
        },
      },
    ]);

    const doc = result[0];

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
