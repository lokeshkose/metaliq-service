import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Company, CompanySchema } from 'src/core/database/mongo/schema/company.schema';

import { COMPANY } from './company.constants';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';
import { TextNormalizer } from 'src/shared/utils/text-normalizer.utils';
import { NormalizeType } from 'src/shared/enums/normalize.enums';
import { CompanyStatus } from 'src/shared/enums/company.enums';

@Injectable()
export class CompanyService extends MongoRepository<Company> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(Company.name, CompanySchema));
  }

  async create(payload: CreateCompanyDto) {
    try {
      return await this.withTransaction(async (session) => {
        if (payload.name) {
          payload.name = TextNormalizer.normalize(payload.name, NormalizeType.TITLE);
        }
        const filter: FilterQuery<Company> = {
          name: payload.name,
        };

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        if (existing && !existing.isDeleted) {
          throw new ConflictException(COMPANY.DUPLICATE);
        }

        if (existing?.isDeleted) {
          await this.updateById(
            existing._id.toString(),
            {
              ...payload,
              status: CompanyStatus.ACTIVE,
              isDeleted: false,
            },
            { session },
          );

          return {
            statusCode: HttpStatus.OK,
            message: COMPANY.CREATED,
            data: { companyId: existing.companyId },
          };
        }

        const doc = await this.save(
          {
            companyId: IdGenerator.generate('COMP', 8),
            ...payload,
          },
          { session },
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: COMPANY.CREATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async findAll(query: CompanyQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Company> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ name: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: COMPANY.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  async findByCompanyId(companyId: string) {
    const doc = await this.findOne({ companyId }, { lean: true });

    if (!doc) throw new NotFoundException(COMPANY.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: COMPANY.FETCHED,
      data: doc,
    };
  }

  async update(companyId: string, dto: UpdateCompanyDto) {
    try {
      return await this.withTransaction(async (session) => {
        if (dto.name) {
          dto.name = TextNormalizer.normalize(dto.name, NormalizeType.TITLE);
        }

        const doc = await this.updateOne({ companyId }, dto, { session, new: true });

        if (!doc) throw new NotFoundException(COMPANY.NOT_FOUND);

        return {
          statusCode: HttpStatus.OK,
          message: COMPANY.UPDATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async delete(companyId: string) {
    const existing = await this.findOne({ companyId });

    if (!existing) throw new NotFoundException(COMPANY.NOT_FOUND);

    await this.softDelete({ companyId });

    return {
      statusCode: HttpStatus.OK,
      message: COMPANY.DELETED,
      data: existing,
    };
  }

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(COMPANY.DUPLICATE);
    }
    throw error;
  }
}
