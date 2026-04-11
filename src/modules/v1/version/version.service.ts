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

import * as semver from 'semver';
import { Platform } from 'src/shared/enums/app.enums';
import { VersionStatus } from 'src/shared/enums/version.enums';

@Injectable()
export class VersionService extends MongoRepository<Version> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(Version.name, VersionSchema));
  }

  /* ======================================================
   * CREATE
   * ====================================================== */
  async create(payload: CreateVersionDto) {
    try {
      return await this.withTransaction(async (session) => {
        const { versionNumber, platform } = payload;

        /* ---------- DUPLICATE CHECK ---------- */
        const existing = await this.findOne(
          { versionNumber, platform },
          { session, includeDeleted: true },
        );

        if (existing && !existing.isDeleted) {
          throw new ConflictException(VERSION.DUPLICATE);
        }

        /* ---------- RESET OLD LATEST ---------- */
        await this.updateMany({ platform, isLatest: true }, { isLatest: false }, { session });

        /* ---------- RESTORE DELETED ---------- */
        if (existing?.isDeleted) {
          await this.updateById(
            existing._id.toString(),
            {
              ...payload,
              isLatest: true, // ✅ controlled here
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

        /* ---------- CREATE ---------- */
        const doc = await this.save(
          {
            versionId: IdGenerator.generate('VERS', 8),
            ...payload,
            isLatest: true, // ✅ always latest
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

  /* ======================================================
   * FIND ALL
   * ====================================================== */
  async findAll(query: VersionQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Version> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ versionId: regex }, { versionNumber: regex }];
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

  /* ======================================================
   * FIND ONE
   * ====================================================== */
  async findByVersionId(versionId: string) {
    const doc = await this.findOne({ versionId }, { lean: true });

    if (!doc) throw new NotFoundException(VERSION.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: VERSION.FETCHED,
      data: doc,
    };
  }

  /* ======================================================
   * UPDATE
   * ====================================================== */
  async update(versionId: string, dto: UpdateVersionDto) {
    try {
      return await this.withTransaction(async (session) => {
        const existing = await this.findOne({ versionId }, { session });

        if (!existing) throw new NotFoundException(VERSION.NOT_FOUND);

        /* ---------- BLOCK USER CONTROL ---------- */
        delete (dto as any).isLatest;

        /* ---------- IF VERSION CHANGED → MAKE LATEST ---------- */
        if (dto.versionNumber) {
          await this.updateMany(
            { platform: existing.platform, isLatest: true },
            { isLatest: false },
            { session },
          );

          (dto as any).isLatest = true; // ✅ controlled internally
        }

        const doc = await this.updateOne({ versionId }, dto, { session, new: true });

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

  /* ======================================================
   * DELETE
   * ====================================================== */
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

  /* ======================================================
   * GET LATEST VERSION
   * ====================================================== */
  async getLatestVersion(platform: Platform) {
    const latest = await this.findOne(
      {
        platform,
        isLatest: true,
        status: VersionStatus.ACTIVE,
      },
      { lean: true },
    );

    if (!latest) {
      throw new NotFoundException('No active version found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: VERSION.FETCHED,
      data: latest,
    };
  }

  /* ======================================================
   * CHECK VERSION (MOBILE API)
   * ====================================================== */
  async checkVersion(platform: Platform, currentVersion: string) {
    const latest = await this.findOne({
      platform,
      isLatest: true,
      status: VersionStatus.ACTIVE,
    });

    if (!latest) {
      throw new NotFoundException('No version found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Version check',
      data: {
        latestVersion: latest.versionNumber,
        forceUpdate: latest.forceUpdate,
        updateRequired: semver.lt(currentVersion, latest.versionNumber),
        minSupportedVersion: latest.minSupportedVersion,
        downloadUrl: latest.downloadUrl,
      },
    };
  }

  /* ======================================================
   * DUPLICATE ERROR HANDLER
   * ====================================================== */
  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(VERSION.DUPLICATE);
    }
    throw error;
  }
}
