/**
 * Product Controller
 * -------------------
 * Purpose : Exposes APIs for managing products
 * Used by : WEB / MOBILE / ADMIN PANEL
 *
 * Responsibilities:
 * - Create products
 * - Fetch products with filters & pagination
 * - Retrieve individual product details
 * - Update product
 * - Soft delete products
 *
 * Notes:
 * - Products act as master reference data
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

import {
  API_MODULE,
  API_MODULE_ENABLE_KEYS,
  V1,
} from 'src/shared/constants/api.constants';

import { Permissions } from 'src/core/decorators/permission.decorator';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PRODUCT } from './product.constants';

@ApiTags('Product')
@FeatureFlag(API_MODULE_ENABLE_KEYS.PRODUCT)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.PRODUCT,
  version: V1,
})
export class ProductController {
  constructor(private readonly service: ProductService) {}

  /**
   * Create Product
   * --------------
   */
  @Permissions('PRODUCT_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({ type: CreateProductDto })
  @ApiSuccessResponse(
    { productId: 'PROD-001' },
    PRODUCT.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  /**
   * Get Products
   * ------------
   */
  @Get()
  @Permissions('PRODUCT_VIEW')
  async findAll(@Query() query: ProductQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Product by ID
   * -----------------
   */
  @Permissions('PRODUCT_VIEW')
  @Get(':productId')
  @ApiParam({ name: 'productId', description: 'Product productId' })
  async findOne(@Param('productId') productId: string) {
    return this.service.findByProductId(productId);
  }

  /**
   * Update Product
   * ---------------
   */
  @Permissions('PRODUCT_UPDATE')
  @Patch(':productId')
  @ApiParam({ name: 'productId', description: 'Product productId' })
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(productId, dto);
  }

  /**
   * Delete Product
   * ---------------
   */
  @Permissions('PRODUCT_DELETE')
  @Delete(':productId')
  @ApiParam({ name: 'productId', description: 'Product productId' })
  async delete(@Param('productId') productId: string) {
    return this.service.delete(productId);
  }
}
