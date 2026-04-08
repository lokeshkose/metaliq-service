/**
 * Device Controller
 * ------------------
 * Purpose : Exposes APIs for managing devices
 * Used by : WEB / MOBILE / ADMIN PANEL
 *
 * Responsibilities:
 * - Create devices
 * - Fetch devices with filters & pagination
 * - Retrieve individual device details
 * - Update device
 * - Soft delete devices
 *
 * Notes:
 * - Devices act as master reference data
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
   * -------------
   */
  @Permissions('DEVICE_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create device' })
  @ApiBody({ type: CreateDeviceDto })
  @ApiSuccessResponse({ profileId: 'DEVI-001' }, DEVICE.CREATED, HttpStatus.CREATED)
  async create(@Body() dto: CreateDeviceDto) {
    return this.service.create(dto);
  }

  /**
   * Get Devices
   * -----------
   */
  @Get()
  @Permissions('DEVICE_VIEW')
  async findAll(@Query() query: DeviceQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Device by ID
   * ----------------
   */
  @Permissions('DEVICE_VIEW')
  @Get(':profileId')
  @ApiParam({ name: 'profileId', description: 'Device profileId' })
  async findOne(@Param('profileId') profileId: string) {
    return this.service.findByProfileId(profileId);
  }

  /**
   * Update Device
   * --------------
   */
  @Permissions('DEVICE_UPDATE')
  @Patch(':deviceId')
  @ApiParam({ name: 'profileId', description: 'Device profileId' })
  async update(@Param('profileId') deviceId: string, @Body() dto: UpdateDeviceDto) {
    return this.service.update({ deviceId, userId: '' }, dto);
  }

  /**
   * Delete Device
   * --------------
   */
  @Permissions('DEVICE_DELETE')
  @Delete(':deviceId')
  @ApiParam({ name: 'deviceId', description: 'Device profileId' })
  async delete(@Param('deviceId') deviceId: string) {
    return this.service.delete(deviceId);
  }
}
