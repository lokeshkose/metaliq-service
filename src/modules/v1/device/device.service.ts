import { Injectable, NotFoundException, ConflictException, HttpStatus } from '@nestjs/common';

import { MongoService } from 'src/core/database/mongo/mongo.service';
import { MongoRepository } from 'src/core/database/mongo/mongo.repository';
import { FilterQuery } from 'src/core/database/mongo/mongo.interface';

import { Device, DeviceSchema } from 'src/core/database/mongo/schema/device.schema';

import { DEVICE } from './device.constants';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { DeviceStatus } from 'src/shared/enums/device.enums';
import { ClientSession } from 'mongoose';

@Injectable()
export class DeviceService extends MongoRepository<Device> {
  constructor(mongo: MongoService) {
    super(mongo.getModel(Device.name, DeviceSchema));
  }

  /* ======================================================
   * CREATE / UPSERT DEVICE
   * ====================================================== */
  async create(payload: CreateDeviceDto, session?: ClientSession) {
    try {
      return await this.withTransaction(async (session) => {
        const { deviceId, profileId, userId } = payload;

        /* ---------- Deactivate other devices (optional rule) ---------- */
        await this.updateMany(
          {
            profileId,
            deviceId: { $ne: deviceId } as any,
          },
          {
            status: DeviceStatus.INACTIVE,
          },
          { session },
        );

        /* ---------- UPSERT DEVICE ---------- */
        const doc = await this.model.findOneAndUpdate(
          {
            deviceId,
            profileId,
            userId,
          },
          {
            $set: {
              ...payload,
              lastLoginAt: new Date(),
              status: DeviceStatus.ACTIVE,
              isDeleted: false,
            },
          },
          {
            new: true,
            upsert: true,
            session,
          },
        );

        return {
          statusCode: HttpStatus.OK,
          message: DEVICE.CREATED,
          data: doc,
        };
      }, session);
    } catch (error) {
      this.handleDuplicateError(error);
    }
  }

  /* ======================================================
   * FIND ALL
   * ====================================================== */
  async findAll(query: DeviceQueryDto) {
    const { searchText, status, page = 1, limit = 20 } = query;

    const filter: FilterQuery<Device> = {};

    if (status) filter.status = status;

    if (searchText) {
      const regex = new RegExp(searchText, 'i');
      filter.$or = [{ profileId: regex }];
    }

    const result = await this.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
    });

    return {
      statusCode: HttpStatus.OK,
      message: DEVICE.FETCHED,
      data: result.items,
      meta: result.meta,
    };
  }

  /* ======================================================
   * FIND BY PROFILE
   * ====================================================== */
  async findByProfileId(profileId: string) {
    const doc = await this.findOne({ profileId }, { lean: true });

    if (!doc) throw new NotFoundException(DEVICE.NOT_FOUND);

    return {
      statusCode: HttpStatus.OK,
      message: DEVICE.FETCHED,
      data: doc,
    };
  }

  /* ======================================================
   * UPDATE (WITH UPSERT SUPPORT)
   * ====================================================== */
  async update(
    identifier: { userId: string; deviceId: string },
    dto: UpdateDeviceDto,
    options?: { upsert?: boolean },
  ) {
    try {
      return await this.withTransaction(async (session) => {
        const doc = await this.model.findOneAndUpdate(
          identifier,
          {
            $set: dto,
          },
          {
            new: true,
            upsert: options?.upsert || false,
            session,
          },
        );

        return {
          statusCode: HttpStatus.OK,
          message: DEVICE.UPDATED,
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
  async delete(profileId: string) {
    const existing = await this.findOne({ profileId });

    if (!existing) throw new NotFoundException(DEVICE.NOT_FOUND);

    await this.softDelete({ profileId });

    return {
      statusCode: HttpStatus.OK,
      message: DEVICE.DELETED,
      data: existing,
    };
  }

  /* ======================================================
   * DUPLICATE HANDLER
   * ====================================================== */
  private handleDuplicateError(error: any): never {
    if (error?.code === 11000 || error?.code === 11001) {
      throw new ConflictException(DEVICE.DUPLICATE);
    }
    throw error;
  }
}
