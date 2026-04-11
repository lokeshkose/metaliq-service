/**
 * Price Controller
 */

import {
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { FeatureFlag } from 'src/core/decorators/feature-flag.decorator';
import { ApiSuccessResponse } from 'src/core/swagger/api.response.swagger';
import {
  ApiInternalErrorResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiNotFoundResponse,
} from 'src/core/swagger/api-error.response.swagger';

import { API_MODULE, API_MODULE_ENABLE_KEYS, V1 } from 'src/shared/constants/api.constants';

import { Permissions } from 'src/core/decorators/permission.decorator';

import { PriceService } from './price.service';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { PriceQueryDto } from './dto/price-query.dto';
import { PRICE } from './price.constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/core/decorators/public.decorator';

@ApiTags('Price')
@FeatureFlag(API_MODULE_ENABLE_KEYS.PRICE)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.PRICE,
  version: V1,
})
export class PriceController {
  constructor(private readonly service: PriceService) {}

  /**
   * Create Price
   */
  @Permissions('PRICE_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create price' })
  @ApiBody({ type: CreatePriceDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: PRICE.CREATED,
      data: {
        priceId: 'PRIC-001',
        productId: 'PROD-001',
        price: 100,
        type: 'STANDARD',
        effectiveAt: '2026-04-11T10:00:00Z',
        status: 'ACTIVE',
      },
    },
    PRICE.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreatePriceDto) {
    return this.service.create(dto);
  }

  /**
   * Bulk Upload Prices
   */
  @Permissions('PRICE_CREATE')
  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk upload prices via Excel' })

  // ✅ IMPORTANT: tells Swagger this is file upload
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: PRICE.BULK_UPLOADED,
      data: {
        total: 10,
        success: 8,
        failed: 2,
        failedData: [
          {
            row: 2,
            error: 'Invalid productId',
            data: {
              productId: 'INVALID',
              price: 100,
            },
          },
        ],
      },
    },
    PRICE.BULK_UPLOADED,
    HttpStatus.CREATED,
  )
  async bulkUpload(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.service.bulkUpload(file);
  }

  /**
   * Get Prices
   */
  @Get()
  @Permissions('PRICE_VIEW')
  @ApiOperation({ summary: 'Get price list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRICE.FETCHED,
      data: [
        {
          priceId: 'PRIC-001',
          productId: 'PROD-001',
          price: 100,
          type: 'STANDARD',
          effectiveAt: '2026-04-11T10:00:00Z',
          status: 'ACTIVE',
        },
      ],
      meta: {
        totalItems: 100,
        currentPage: 1,
        totalPages: 5,
        itemsPerPage: 20,
      },
    },
    PRICE.FETCHED,
  )
  async findAll(@Query() query: PriceQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Price by ID
   */
  @Permissions('PRICE_VIEW')
  @Get(':priceId')
  @ApiOperation({ summary: 'Get price by ID' })
  @ApiParam({ name: 'priceId', description: 'Price priceId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRICE.FETCHED,
      data: {
        priceId: 'PRIC-001',
        productId: 'PROD-001',
        price: 100,
        type: 'STANDARD',
        effectiveAt: '2026-04-11T10:00:00Z',
        status: 'ACTIVE',
      },
    },
    PRICE.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('priceId') priceId: string) {
    return this.service.findByPriceId(priceId);
  }

  /**
   * Update Price
   */
  @Permissions('PRICE_UPDATE')
  @Patch(':priceId')
  @ApiOperation({ summary: 'Update price' })
  @ApiParam({ name: 'priceId', description: 'Price priceId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRICE.UPDATED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    PRICE.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('priceId') priceId: string, @Body() dto: UpdatePriceDto) {
    return this.service.update(priceId, dto);
  }

  /**
   * Delete Price
   */
  @Permissions('PRICE_DELETE')
  @Delete(':priceId')
  @ApiOperation({ summary: 'Delete price' })
  @ApiParam({ name: 'priceId', description: 'Price priceId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRICE.DELETED,
      data: {
        priceId: 'PRIC-001',
        productId: 'PROD-001',
        status: 'INACTIVE',
      },
    },
    PRICE.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('priceId') priceId: string) {
    return this.service.delete(priceId);
  }
}
