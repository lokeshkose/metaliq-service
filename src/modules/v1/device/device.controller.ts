/**
 * Device Controller
 * ------------------
 * Purpose : Exposes APIs for managing devices
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { FeatureFlag } from 'src/core/decorators/feature-flag.decorator';
import { ApiSuccessResponse } from 'src/core/swagger/api.response.swagger';
import {
  ApiInternalErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from 'src/core/swagger/api-error.response.swagger';

import { API_MODULE, API_MODULE_ENABLE_KEYS, V1 } from 'src/shared/constants/api.constants';

import { Permissions } from 'src/core/decorators/permission.decorator';

import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { DEVICE } from './device.constants';

@ApiTags('Device')
@FeatureFlag(API_MODULE_ENABLE_KEYS.DEVICE)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.DEVICE,
  version: V1,
})
export class DeviceController {
  constructor(private readonly service: DeviceService) {}

  /**
   * Create Device
   */
  @Permissions('DEVICE_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create device' })
  @ApiBody({ type: CreateDeviceDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: DEVICE.CREATED,
      data: {
        deviceId: 'DEVI-001',
        name: 'Samsung Tablet',
        userId: 'USER-001',
        status: 'ACTIVE',
      },
    },
    DEVICE.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateDeviceDto) {
    return this.service.create(dto);
  }

  /**
   * Get Devices
   */
  @Get()
  @Permissions('DEVICE_VIEW')
  @ApiOperation({ summary: 'Get device list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: DEVICE.FETCHED,
      data: [
        {
          deviceId: 'DEVI-001',
          name: 'Samsung Tablet',
          userId: 'USER-001',
          status: 'ACTIVE',
        },
      ],
      meta: {
        totalItems: 50,
        currentPage: 1,
        totalPages: 3,
        itemsPerPage: 20,
      },
    },
    DEVICE.FETCHED,
  )
  async findAll(@Query() query: DeviceQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Device by ID
   */
  @Permissions('DEVICE_VIEW')
  @Get(':deviceId')
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiParam({ name: 'deviceId', description: 'Device deviceId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: DEVICE.FETCHED,
      data: {
        deviceId: 'DEVI-001',
        name: 'Samsung Tablet',
        userId: 'USER-001',
        status: 'ACTIVE',
      },
    },
    DEVICE.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('deviceId') deviceId: string) {
    return this.service.findByProfileId(deviceId);
  }

  /**
   * Update Device
   */
  @Permissions('DEVICE_UPDATE')
  @Patch(':deviceId')
  @ApiOperation({ summary: 'Update device' })
  @ApiParam({ name: 'deviceId', description: 'Device deviceId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: DEVICE.UPDATED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    DEVICE.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('deviceId') deviceId: string, @Body() dto: UpdateDeviceDto) {
    return this.service.update({ deviceId, userId: '' }, dto);
  }

  /**
   * Delete Device
   */
  @Permissions('DEVICE_DELETE')
  @Delete(':deviceId')
  @ApiOperation({ summary: 'Delete device' })
  @ApiParam({ name: 'deviceId', description: 'Device deviceId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: DEVICE.DELETED,
      data: {
        deviceId: 'DEVI-001',
        status: 'INACTIVE',
      },
    },
    DEVICE.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('deviceId') deviceId: string) {
    return this.service.delete(deviceId);
  }
}
