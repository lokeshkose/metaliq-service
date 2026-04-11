import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Employee, EmployeeSchema } from 'src/core/database/mongo/schema/employee.schema';

import { EMPLOYEE } from './employee.constants';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';

import { IdGenerator } from 'src/shared/utils/id-generator.utils';
import { TextNormalizer } from 'src/shared/utils/text-normalizer.utils';
import { NormalizeType } from 'src/shared/enums/normalize.enums';

import { UserService } from '../user/user.service'; // ✅ ADD THIS
import { UserStatus, UserType } from 'src/shared/enums/user.enums';
import { CustomerService } from '../customer/customer.service';
import { ProductService } from '../product/product.service';
import { ProductCategoryService } from '../product-category/product-category.service';
import { InquiryService } from '../inquiry/inquiry.service';
import { InquiryStatus } from 'src/shared/enums/inquiry.enums';
import { EmployeeStatus } from 'src/shared/enums/employee.enums';
import { RedisRepository } from 'src/core/database/radis/radis.repository';

@Injectable()
export class EmployeeService extends MongoRepository<Employee> {
  constructor(
    mongo: MongoService,
    private readonly userService: UserService, // ✅
    private readonly customerService: CustomerService,
    private readonly productService: ProductService,
    private readonly productCategoryService: ProductCategoryService,
    private readonly inquiryService: InquiryService,
    private readonly redis: RedisRepository,
  ) {
    super(mongo.getModel(Employee.name, EmployeeSchema));
  }

  /* ======================================================
   * CREATE (WITH USER CREATION)
   * ====================================================== */
  async create(payload: CreateEmployeeDto) {
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
        const filter: FilterQuery<Employee> = {
          $or: [{ mobile: payload.mobile }, ...(payload.email ? [{ email: payload.email }] : [])],
        };

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        let employeeId: string;

        /* ---------- RESTORE OR CREATE ---------- */
        if (existing?.isDeleted) {
          await this.updateById(
            existing._id.toString(),
            {
              ...payload,
              isDeleted: false,
              status: EmployeeStatus.ACTIVE,
            },
            { session },
          );

          employeeId = existing.employeeId;
          await this.userService.updateOne(
            { profileId: employeeId },
            {
              status: UserStatus.ACTIVE,
            },
          );
        } else if (existing) {
          throw new ConflictException(EMPLOYEE.DUPLICATE);
        } else {
          const doc = await this.save(
            {
              employeeId: IdGenerator.generate('EMPL', 8),
              ...payload,
            } as any,
            { session },
          );

          employeeId = doc.employeeId;
        }

        /* ======================================================
         * CREATE USER (AUTH)
         * ====================================================== */
        await this.userService.createUser(
          {
            profileId: employeeId,
            mobile: payload.mobile,
            email: payload.email,
            // normalize loginId
            loginId: TextNormalizer.normalize(payload.mobile, NormalizeType.LOWER),

            // default password (can improve later)
            password: payload.password || payload.mobile,

            userType: UserType.EMPLOYEE,
          },
          session,
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: EMPLOYEE.CREATED,
          data: { employeeId },
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  /* ======================================================
   * FIND ALL
   * ====================================================== */
  async findAll(query: EmployeeQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Employee> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');

      filter.$or = [{ employeeId: regex }, { name: regex }, { mobile: regex }, { email: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: EMPLOYEE.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  /* ======================================================
   * FIND BY ID
   * ====================================================== */
  async findByEmployeeId(employeeId: string) {
    const doc = await this.findOne({ employeeId }, { lean: true });

    if (!doc) {
      throw new NotFoundException(EMPLOYEE.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: EMPLOYEE.FETCHED,
      data: doc,
    };
  }

  /* ======================================================
   * UPDATE
   * ====================================================== */
  async update(employeeId: string, dto: UpdateEmployeeDto) {
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
          const filter: FilterQuery<Employee> = {
            employeeId: { $ne: employeeId } as any,
            $or: [
              ...(dto.mobile ? [{ mobile: dto.mobile }] : []),
              ...(dto.email ? [{ email: dto.email }] : []),
            ],
          };

          const existing = await this.findOne(filter, { session });

          if (existing) {
            throw new ConflictException(EMPLOYEE.DUPLICATE);
          }
        }

        if (dto.status) {
          await this.userService.updateOne(
            { profileId: employeeId },
            {
              status: dto.status,
            },
          );
          if (dto.status === EmployeeStatus.INACTIVE) {
            await this.userService.logoutByProfileId(employeeId, session);
          }
        }

        /* ---------- UPDATE ---------- */
        const doc = await this.updateOne({ employeeId }, dto, { session, new: true });

        if (!doc) {
          throw new NotFoundException(EMPLOYEE.NOT_FOUND);
        }

        return {
          statusCode: HttpStatus.OK,
          message: EMPLOYEE.UPDATED,
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
  async delete(employeeId: string) {
    return this.withTransaction(async (session) => {
      /* ======================================================
       * 🔍 FIND EMPLOYEE
       * ====================================================== */
      const existing = await this.findOne({ employeeId }, { session });

      if (!existing) {
        throw new NotFoundException(EMPLOYEE.NOT_FOUND);
      }

      /* ======================================================
       * 🔍 FIND USER (BY PROFILE ID)
       * ====================================================== */
      const user: any = await this.userService.findOne({ profileId: employeeId }, { session });

      if (user) {
        /* ======================================================
         * 🔥 LOGOUT USER (SESSION CLEANUP)
         * ====================================================== */
        await this.userService.logoutByProfileId(employeeId, session);

        /* ======================================================
         * 🚫 DEACTIVATE USER
         * ====================================================== */
        await this.userService.updateOne(
          { profileId: employeeId },
          {
            status: UserStatus.INACTIVE,
          },
          { session },
        );
      }

      /* ======================================================
       * 🗑 SOFT DELETE EMPLOYEE
       * ====================================================== */
      await this.softDelete({ employeeId }, { session });

      return {
        statusCode: HttpStatus.OK,
        message: EMPLOYEE.DELETED,
        data: existing,
      };
    });
  }

  async getEmployeeKpi(query: { employeeId?: string }) {
    const { employeeId } = query;

    /* ======================================================
     * WEEK RANGE
     * ====================================================== */
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    /* ======================================================
     * BASE FILTERS
     * ====================================================== */

    const baseInquiryFilter: any = {
      isDeleted: { $ne: true },
    };

    if (employeeId) {
      baseInquiryFilter.employeeId = employeeId;
    }

    const weekInquiryFilter = {
      ...baseInquiryFilter,
      createdAt: { $gte: weekStart, $lte: weekEnd },
    };

    /* ======================================================
     * PARALLEL EXECUTION
     * ====================================================== */

    const [
      // OVERALL
      totalInquiries,
      pendingInquiryCount,
      overallStatusRaw,

      // THIS WEEK
      weeklyInquiries,
      weeklyPending,
      weeklyStatusRaw,

      // COMMON
      customerCount,
      weeklyCustomerCount,
      productCount,
      weeklyProductCount,
      categoryCount,
    ] = await Promise.all([
      /* ================= OVERALL ================= */

      this.inquiryService.countDocuments(baseInquiryFilter),

      this.inquiryService.countDocuments({
        ...baseInquiryFilter,
        status: InquiryStatus.PENDING,
      }),

      this.inquiryService.aggregate([
        { $match: baseInquiryFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      /* ================= WEEK ================= */

      this.inquiryService.countDocuments(weekInquiryFilter),

      this.inquiryService.countDocuments({
        ...weekInquiryFilter,
        status: InquiryStatus.PENDING,
      }),

      this.inquiryService.aggregate([
        { $match: weekInquiryFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      /* ================= OTHERS ================= */

      this.customerService.countDocuments({ isDeleted: { $ne: true } }),

      this.customerService.countDocuments({
        isDeleted: { $ne: true },
        createdAt: { $gte: weekStart, $lte: weekEnd },
      }),

      this.productService.countDocuments({ isDeleted: { $ne: true } }),

      this.productService.countDocuments({
        isDeleted: { $ne: true },
        createdAt: { $gte: weekStart, $lte: weekEnd },
      }),

      this.productCategoryService.countDocuments({
        isDeleted: { $ne: true },
      }),
    ]);

    /* ======================================================
     * STATUS FORMATTER (REUSABLE)
     * ====================================================== */

    const formatStatus = (raw) => {
      const base: Record<InquiryStatus, number> = {
        [InquiryStatus.PENDING]: 0,
        [InquiryStatus.CLOSED]: 0,
        [InquiryStatus.REJECTED]: 0,
        [InquiryStatus.RESPONDED]: 0,
        [InquiryStatus.CANCELLED]: 0,
      };

      raw.forEach((item) => {
        base[item._id] = item.count;
      });

      return base;
    };

    /* ======================================================
     * RESPONSE
     * ====================================================== */

    return {
      statusCode: 200,
      message: EMPLOYEE.KPI_FETCHED,
      data: {
        weekRange: {
          start: weekStart,
          end: weekEnd,
        },

        overall: {
          totalInquiries,
          pendingInquiryCount,
          customerCount,
          productCount,
          categoryCount,
          statusCounts: formatStatus(overallStatusRaw),
        },

        thisWeek: {
          totalInquiries: weeklyInquiries,
          pendingInquiryCount: weeklyPending,
          customerCount: weeklyCustomerCount,
          productCount: weeklyProductCount,
          statusCounts: formatStatus(weeklyStatusRaw),
        },
      },
    };
  }

  /* ======================================================
   * HANDLE DUPLICATE ERROR
   * ====================================================== */
  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(EMPLOYEE.DUPLICATE);
    }
    throw error;
  }
}
