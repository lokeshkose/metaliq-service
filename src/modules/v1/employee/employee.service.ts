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
import { UserType } from 'src/shared/enums/user.enums';

@Injectable()
export class EmployeeService extends MongoRepository<Employee> {
  constructor(
    mongo: MongoService,
    private readonly userService: UserService, // ✅ INJECT
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
              status: 'ACTIVE',
            },
            { session },
          );

          employeeId = existing.employeeId;
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
    const existing = await this.findOne({ employeeId });

    if (!existing) {
      throw new NotFoundException(EMPLOYEE.NOT_FOUND);
    }

    await this.softDelete({ employeeId });

    return {
      statusCode: HttpStatus.OK,
      message: EMPLOYEE.DELETED,
      data: existing,
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
