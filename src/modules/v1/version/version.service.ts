import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Version, VersionSchema } from 'src/core/database/mongo/schema/version.schema';

import { VERSION } from './version.constants';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { VersionQueryDto } from './dto/version-query.dto';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';

@Injectable()
export class VersionService extends MongoRepository<Version> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(Version.name, VersionSchema));
  }

  async create(payload: CreateVersionDto) {
    try {
      return await this.withTransaction(async (session) => {
        const filter: FilterQuery<Version> = {};

        const existing = await this.findOne(filter, {
          session,
          includeDeleted: true,
        });

        if (existing && !existing.isDeleted) {
          throw new ConflictException(VERSION.DUPLICATE);
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
            message: VERSION.CREATED,
            data: { versionId: existing.versionId },
          };
        }

        const doc = await this.save(
          {
            versionId: IdGenerator.generate('VERS', 8),
            ...payload,
          },
          { session },
        );

        return {
          statusCode: HttpStatus.CREATED,
          message: VERSION.CREATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async findAll(query: VersionQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Version> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ versionId: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: VERSION.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  async findByVersionId(versionId: string) {
    const doc = await this.findOne({ versionId }, { lean: true });

    if (!doc) throw new NotFoundException(VERSION.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: VERSION.FETCHED,
      data: doc,
    };
  }

  async update(versionId: string, dto: UpdateVersionDto) {
    try {
      return await this.withTransaction(async (session) => {
        const doc = await this.updateOne({ versionId }, dto, { session, new: true });

        if (!doc) throw new NotFoundException(VERSION.NOT_FOUND);

        return {
          statusCode: HttpStatus.OK,
          message: VERSION.UPDATED,
          data: doc,
        };
      });
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  async delete(versionId: string) {
    const existing = await this.findOne({ versionId });

    if (!existing) throw new NotFoundException(VERSION.NOT_FOUND);

    await this.softDelete({ versionId });

    return {
      statusCode: HttpStatus.OK,
      message: VERSION.DELETED,
      data: existing,
    };
  }

  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(VERSION.DUPLICATE);
    }
    throw error;
  }
}
