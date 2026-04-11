/**
 * Product Controller
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
   */
  @Permissions('PRODUCT_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({ type: CreateProductDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: PRODUCT.CREATED,
      data: {
        productId: 'PROD-001',
      },
    },
    PRODUCT.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  /**
   * Get Products
   */
  @Get()
  @Permissions('PRODUCT_VIEW')
  @ApiOperation({ summary: 'Get product list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT.FETCHED,
      data: [
        {
          productId: 'PROD-001',
          name: 'Milk',
          currentPrice: 50,
          previousPrice: 45,
          priceDifference: 5,
          category: {
            categoryId: 'CAT-001',
            name: 'Dairy',
            parent: {
              categoryId: 'CAT-ROOT',
              name: 'Food',
            },
          },
        },
      ],
      meta: {
        total: 100,
        page: 1,
        limit: 20,
      },
    },
    PRODUCT.FETCHED,
  )
  async findAll(@Query() query: ProductQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Product by ID
   */
  @Permissions('PRODUCT_VIEW')
  @Get(':productId')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'productId', description: 'Product productId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT.FETCHED,
      data: {
        productId: 'PROD-001',
        name: 'Milk',
        currentPrice: 50,
        previousPrice: 45,
        priceDifference: 5,
        category: {
          categoryId: 'CAT-001',
          name: 'Dairy',
          parent: {
            categoryId: 'CAT-ROOT',
            name: 'Food',
          },
        },
      },
    },
    PRODUCT.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('productId') productId: string) {
    return this.service.findByProductId(productId);
  }

  /**
   * Update Product
   */
  @Permissions('PRODUCT_UPDATE')
  @Patch(':productId')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'productId', description: 'Product productId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT.UPDATED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    PRODUCT.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('productId') productId: string, @Body() dto: UpdateProductDto) {
    return this.service.update(productId, dto);
  }

  /**
   * Delete Product
   */
  @Permissions('PRODUCT_DELETE')
  @Delete(':productId')
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'productId', description: 'Product productId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT.DELETED,
      data: {
        productId: 'PROD-001',
        name: 'Milk',
        status: 'INACTIVE',
      },
    },
    PRODUCT.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('productId') productId: string) {
    return this.service.delete(productId);
  }
}
