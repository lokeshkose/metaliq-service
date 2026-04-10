import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Customer, CustomerSchema } from 'src/core/database/mongo/schema/customer.schema';

import { CUSTOMER } from './customer.constants';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';

import { IdGenerator } from 'src/shared/utils/id-generator.utils';
import { TextNormalizer } from 'src/shared/utils/text-normalizer.utils';
import { NormalizeType } from 'src/shared/enums/normalize.enums';

import { UserService } from '../user/user.service';
import { UserType } from 'src/shared/enums/user.enums';
import { InjectModel } from '@nestjs/mongoose';
import { Inquiry } from 'src/core/database/mongo/schema/inquiry.schema';
import { Model } from 'mongoose';
import { InquiryStatus } from 'src/shared/enums/inquiry.enums';

@Injectable()
export class CustomerService extends MongoRepository<Customer> {
  constructor(
    mongo: MongoService,
    private readonly userService: UserService,
    @InjectModel(Inquiry.name) private InquiryModal: Model<Inquiry>,
  ) {
    super(mongo.getModel(Customer.name, CustomerSchema));
  }

  /* ======================================================
   * CREATE (WITH USER CREATION)
   * ====================================================== */
  async create(payload: CreateCustomerDto) {
    try {
      return await this.withTransaction(async (session) => {
        /* ---------- NORMALIZE ---------- */
        if (payload.name) {
          payload.name = TextNormalizer.normalize(payload.name, NormalizeType.TITLE);
        }

        if (payload.email) {
          payload.email = TextNormalizer.normalize(payload.email, NormalizeType.LOWER);
        }

        /* ---------- DUPLICATE CHECK ---------- */
        const filter: FilterQuery<Customer> = {
          $or: [{ mobile: payload.mobile }, ...(payload.email ? [{ email: payload.email }] : [])],
        };

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        let customerId: string;

        /* ---------- RESTORE OR CREATE ---------- */
        if (existing?.isDeleted) {
          await this.updateById(
            existing._id.toString(),
            {
              ...payload,
              isDeleted: false,
              status: 'ACTIVE',
            },
            { session },
          );

          customerId = existing.customerId;
        } else if (existing) {
          throw new ConflictException(CUSTOMER.DUPLICATE);
        } else {
          const doc = await this.save(
            {
              customerId: IdGenerator.generate('CUST', 8),
              ...payload,
            },
            { session },
          );

          customerId = doc.customerId;
        }

        /* ======================================================
         * CREATE USER (AUTH)
         * ====================================================== */
        await this.userService.createUser(
          {
            profileId: customerId,
            mobile: payload.mobile,
            email: payload.email,

            loginId: TextNormalizer.normalize(payload.mobile, NormalizeType.LOWER),

            password: payload.password || payload.mobile,

            userType: UserType.CUSTOMER,
          },
          session,
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: CUSTOMER.CREATED,
          data: { customerId },
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  /* ======================================================
   * FIND ALL
   * ====================================================== */
  async findAll(query: CustomerQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Customer> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');

      filter.$or = [{ name: regex }, { mobile: regex }, { email: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: CUSTOMER.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  /* ======================================================
   * FIND BY ID
   * ====================================================== */
  async findByCustomerId(customerId: string) {
    const doc = await this.findOne({ customerId }, { lean: true });

    if (!doc) {
      throw new NotFoundException(CUSTOMER.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: CUSTOMER.FETCHED,
      data: doc,
    };
  }

  /* ======================================================
   * UPDATE
   * ====================================================== */
  async update(customerId: string, dto: UpdateCustomerDto) {
    try {
      return await this.withTransaction(async (session) => {
        /* ---------- NORMALIZE ---------- */
        if (dto.name) {
          dto.name = TextNormalizer.normalize(dto.name, NormalizeType.TITLE);
        }

        if (dto.email) {
          dto.email = TextNormalizer.normalize(dto.email, NormalizeType.LOWER);
        }

        /* ---------- DUPLICATE CHECK ---------- */
        if (dto.mobile || dto.email) {
          const filter: FilterQuery<Customer> = {
            customerId: { $ne: customerId } as any,
            $or: [
              ...(dto.mobile ? [{ mobile: dto.mobile }] : []),
              ...(dto.email ? [{ email: dto.email }] : []),
            ],
          };

          const existing = await this.findOne(filter, { session });

          if (existing) {
            throw new ConflictException(CUSTOMER.DUPLICATE);
          }
        }

        /* ---------- UPDATE ---------- */
        const doc = await this.updateOne({ customerId }, dto, { session, new: true });

        if (!doc) {
          throw new NotFoundException(CUSTOMER.NOT_FOUND);
        }

        return {
          statusCode: HttpStatus.OK,
          message: CUSTOMER.UPDATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  /* ======================================================
   * DELETE (SOFT)
   * ====================================================== */
  async delete(customerId: string) {
    const existing = await this.findOne({ customerId });

    if (!existing) {
      throw new NotFoundException(CUSTOMER.NOT_FOUND);
    }

    await this.softDelete({ customerId });

    return {
      statusCode: HttpStatus.OK,
      message: CUSTOMER.DELETED,
      data: existing,
    };
  }

  async getKpi(query: { customerId?: string }) {
    const { customerId } = query;

    /* ======================================================
     * MATCH FILTER
     * ====================================================== */
    const match: any = {
      isDeleted: { $ne: true },
    };

    if (customerId) {
      match.customerId = customerId; // ✅ FIXED
    }

    /* ======================================================
     * AGGREGATION
     * ====================================================== */
    const result = await this.InquiryModal.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    /* ======================================================
     * DEFAULT RESPONSE (IMPORTANT)
     * ====================================================== */
    const response: Record<string, number> = {
      [InquiryStatus.PENDING]: 0,
      [InquiryStatus.CLOSED]: 0,
      [InquiryStatus.REJECTED]: 0,
      [InquiryStatus.RESPONDED]: 0,
      [InquiryStatus.CANCELLED]: 0,
      TOTAL: 0,
    };

    result.forEach((item) => {
      response[item._id] = item.count;
      response.TOTAL += item.count;
    });

    /* ======================================================
     * RESPONSE
     * ====================================================== */
    return {
      statusCode: HttpStatus.OK,
      message: CUSTOMER.KPI_FETCHED,
      data: response,
    };
  }

  /* ======================================================
   * HANDLE DUPLICATE ERROR
   * ====================================================== */
  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(CUSTOMER.DUPLICATE);
    }
    throw error;
  }
}
