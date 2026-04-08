/**
 * Version Controller
 * -------------------
 * Purpose : Exposes APIs for managing versions
 * Used by : WEB / MOBILE / ADMIN PANEL
 *
 * Responsibilities:
 * - Create versions
 * - Fetch versions with filters & pagination
 * - Retrieve individual version details
 * - Update version
 * - Soft delete versions
 *
 * Notes:
 * - Versions act as master reference data
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

import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { VersionQueryDto } from './dto/version-query.dto';
import { VERSION } from './version.constants';

@ApiTags('Version')
@FeatureFlag(API_MODULE_ENABLE_KEYS.VERSION)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.VERSION,
  version: V1,
})
export class VersionController {
  constructor(private readonly service: VersionService) {}

  /**
   * Create Version
   * --------------
   */
  @Permissions('VERSION_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create version' })
  @ApiBody({ type: CreateVersionDto })
  @ApiSuccessResponse({ versionId: 'VERS-001' }, VERSION.CREATED, HttpStatus.CREATED)
  async create(@Body() dto: CreateVersionDto) {
    return this.service.create(dto);
  }

  /**
   * Get Versions
   * ------------
   */
  @Get()
  @Permissions('VERSION_VIEW')
  async findAll(@Query() query: VersionQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Version by ID
   * -----------------
   */
  @Permissions('VERSION_VIEW')
  @Get(':versionId')
  @ApiParam({ name: 'versionId', description: 'Version versionId' })
  async findOne(@Param('versionId') versionId: string) {
    return this.service.findByVersionId(versionId);
  }

  /**
   * Update Version
   * ---------------
   */
  @Permissions('VERSION_UPDATE')
  @Patch(':versionId')
  @ApiParam({ name: 'versionId', description: 'Version versionId' })
  async update(@Param('versionId') versionId: string, @Body() dto: UpdateVersionDto) {
    return this.service.update(versionId, dto);
  }

  /**
   * Delete Version
   * ---------------
   */
  @Permissions('VERSION_DELETE')
  @Delete(':versionId')
  @ApiParam({ name: 'versionId', description: 'Version versionId' })
  async delete(@Param('versionId') versionId: string) {
    return this.service.delete(versionId);
  }
}
