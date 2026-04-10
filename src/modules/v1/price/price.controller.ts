/**
 * Price Controller
 * -----------------
 * Purpose : Exposes APIs for managing prices
 * Used by : WEB / MOBILE / ADMIN PANEL
 *
 * Responsibilities:
 * - Create prices
 * - Fetch prices with filters & pagination
 * - Retrieve individual price details
 * - Update price
 * - Soft delete prices
 *
 * Notes:
 * - Prices act as master reference data
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
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { FeatureFlag } from 'src/core/decorators/feature-flag.decorator';
import { ApiSuccessResponse } from 'src/core/swagger/api.response.swagger';
import {
  ApiInternalErrorResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from 'src/core/swagger/api-error.response.swagger';

import { API_MODULE, API_MODULE_ENABLE_KEYS, V1 } from 'src/shared/constants/api.constants';

import { Permissions } from 'src/core/decorators/permission.decorator';

import { PriceService } from './price.service';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { PriceQueryDto } from './dto/price-query.dto';
import { PRICE } from './price.constants';
import { FileInterceptor } from '@nestjs/platform-express';

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
   * ------------
   */
  @Permissions('PRICE_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create price' })
  @ApiBody({ type: CreatePriceDto })
  @ApiSuccessResponse({ priceId: 'PRIC-001' }, PRICE.CREATED, HttpStatus.CREATED)
  async create(@Body() dto: CreatePriceDto) {
    return this.service.create(dto);
  }

  /**
   * Bulk Upload Prices (Excel)
   * --------------------------
   */
  @Permissions('PRICE_CREATE')
  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk upload prices via Excel' })
  async bulkUpload(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.service.bulkUpload(file);
  }

  /**
   * Get Prices
   * ----------
   */
  @Get()
  @Permissions('PRICE_VIEW')
  async findAll(@Query() query: PriceQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Price by ID
   * ---------------
   */
  @Permissions('PRICE_VIEW')
  @Get(':priceId')
  @ApiParam({ name: 'priceId', description: 'Price priceId' })
  async findOne(@Param('priceId') priceId: string) {
    return this.service.findByPriceId(priceId);
  }

  /**
   * Update Price
   * -------------
   */
  @Permissions('PRICE_UPDATE')
  @Patch(':priceId')
  @ApiParam({ name: 'priceId', description: 'Price priceId' })
  async update(@Param('priceId') priceId: string, @Body() dto: UpdatePriceDto) {
    return this.service.update(priceId, dto);
  }

  /**
   * Delete Price
   * -------------
   */
  @Permissions('PRICE_DELETE')
  @Delete(':priceId')
  @ApiParam({ name: 'priceId', description: 'Price priceId' })
  async delete(@Param('priceId') priceId: string) {
    return this.service.delete(priceId);
  }
}
