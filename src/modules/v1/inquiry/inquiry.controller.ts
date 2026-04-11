/**
 * Inquiry Controller
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
   */
  @Permissions('INQUIRY_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create inquiry' })
  @ApiBody({ type: CreateInquiryDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: INQUIRY.CREATED,
      data: {
        inquiryId: 'INQ00001',
      },
    },
    INQUIRY.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateInquiryDto) {
    return this.service.create(dto);
  }

  /**
   * Get Inquiries
   */
  @Get()
  @Permissions('INQUIRY_VIEW')
  @ApiOperation({ summary: 'Get inquiry list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: INQUIRY.FETCHED,
      data: [
        {
          inquiryId: 'INQ00001',
          customerId: 'CUST-001',
          customerName: 'John Doe',
          productId: 'PROD-001',
          customerPrice: 100,
          customerQuantity: 5,
          status: 'PENDING',

          timeline: [
            {
              action: 'CREATED',
              before: null,
              after: {
                status: 'PENDING',
              },
              performedBy: {
                userId: 'USER-001',
                name: 'Admin',
              },
              metadata: {
                ip: '127.0.0.1',
              },
              createdAt: '2026-04-11T10:00:00Z',
            },
          ],
        },
      ],
      meta: {
        totalItems: 100,
        currentPage: 1,
        totalPages: 5,
        itemsPerPage: 20,
      },
    },
    INQUIRY.FETCHED,
  )
  async findAll(@Query() query: InquiryQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Inquiry by ID
   */
  @Permissions('INQUIRY_VIEW')
  @Get(':inquiryId')
  @ApiOperation({ summary: 'Get inquiry by ID' })
  @ApiParam({ name: 'inquiryId', description: 'Inquiry inquiryId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: INQUIRY.FETCHED,
      data: {
        inquiryId: 'INQ00001',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        productId: 'PROD-001',
        customerPrice: 100,
        customerQuantity: 5,
        status: 'PENDING',

        timeline: [
          {
            action: 'CREATED',
            before: null,
            after: {
              status: 'PENDING',
            },
            performedBy: {
              userId: 'USER-001',
              name: 'Admin',
            },
            metadata: {
              ip: '127.0.0.1',
            },
            createdAt: '2026-04-11T10:00:00Z',
          },
        ],
      },
    },
    INQUIRY.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('inquiryId') inquiryId: string) {
    return this.service.findByInquiryId(inquiryId);
  }

  /**
   * Update Inquiry
   */
  @Permissions('INQUIRY_UPDATE')
  @Patch(':inquiryId')
  @ApiOperation({ summary: 'Update inquiry' })
  @ApiParam({ name: 'inquiryId', description: 'Inquiry inquiryId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: INQUIRY.UPDATED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    INQUIRY.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('inquiryId') inquiryId: string, @Body() dto: UpdateInquiryDto) {
    return this.service.update(inquiryId, dto);
  }

  /**
   * Delete Inquiry
   */
  @Permissions('INQUIRY_DELETE')
  @Delete(':inquiryId')
  @ApiOperation({ summary: 'Delete inquiry' })
  @ApiParam({ name: 'inquiryId', description: 'Inquiry inquiryId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: INQUIRY.DELETED,
      data: {
        inquiryId: 'INQ00001',
        status: 'INACTIVE',
      },
    },
    INQUIRY.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('inquiryId') inquiryId: string) {
    return this.service.delete(inquiryId);
  }
}
