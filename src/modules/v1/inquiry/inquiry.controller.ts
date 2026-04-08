/**
 * Inquiry Controller
 * -------------------
 * Purpose : Exposes APIs for managing inquirys
 * Used by : WEB / MOBILE / ADMIN PANEL
 *
 * Responsibilities:
 * - Create inquirys
 * - Fetch inquirys with filters & pagination
 * - Retrieve individual inquiry details
 * - Update inquiry
 * - Soft delete inquirys
 *
 * Notes:
 * - Inquirys act as master reference data
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

import { InquiryService } from './inquiry.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { InquiryQueryDto } from './dto/inquiry-query.dto';
import { INQUIRY } from './inquiry.constants';

@ApiTags('Inquiry')
@FeatureFlag(API_MODULE_ENABLE_KEYS.INQUIRY)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.INQUIRY,
  version: V1,
})
export class InquiryController {
  constructor(private readonly service: InquiryService) {}

  /**
   * Create Inquiry
   * --------------
   */
  @Permissions('INQUIRY_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create inquiry' })
  @ApiBody({ type: CreateInquiryDto })
  @ApiSuccessResponse({ inquiryId: 'INQU-001' }, INQUIRY.CREATED, HttpStatus.CREATED)
  async create(@Body() dto: CreateInquiryDto) {
    return this.service.create(dto);
  }

  /**
   * Get Inquirys
   * ------------
   */
  @Get()
  @Permissions('INQUIRY_VIEW')
  async findAll(@Query() query: InquiryQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Inquiry by ID
   * -----------------
   */
  @Permissions('INQUIRY_VIEW')
  @Get(':inquiryId')
  @ApiParam({ name: 'inquiryId', description: 'Inquiry inquiryId' })
  async findOne(@Param('inquiryId') inquiryId: string) {
    return this.service.findByInquiryId(inquiryId);
  }

  /**
   * Update Inquiry
   * ---------------
   */
  @Permissions('INQUIRY_UPDATE')
  @Patch(':inquiryId')
  @ApiParam({ name: 'inquiryId', description: 'Inquiry inquiryId' })
  async update(@Param('inquiryId') inquiryId: string, @Body() dto: UpdateInquiryDto) {
    return this.service.update(inquiryId, dto);
  }

  /**
   * Delete Inquiry
   * ---------------
   */
  @Permissions('INQUIRY_DELETE')
  @Delete(':inquiryId')
  @ApiParam({ name: 'inquiryId', description: 'Inquiry inquiryId' })
  async delete(@Param('inquiryId') inquiryId: string) {
    return this.service.delete(inquiryId);
  }
}
