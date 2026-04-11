/**
 * ProductCategory Controller
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

import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoryQueryDto } from './dto/product-category-query.dto';
import { PRODUCT_CATEGORY } from './product-category.constants';

@ApiTags('Product-category')
@FeatureFlag(API_MODULE_ENABLE_KEYS.PRODUCT_CATEGORY)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.PRODUCT_CATEGORY,
  version: V1,
})
export class ProductCategoryController {
  constructor(private readonly service: ProductCategoryService) {}

  /**
   * Create ProductCategory
   */
  @Permissions('PRODUCT_CATEGORY_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product-category' })
  @ApiBody({ type: CreateProductCategoryDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: PRODUCT_CATEGORY.CREATED,
      data: {
        categoryId: 'CAT-001',
      },
    },
    PRODUCT_CATEGORY.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateProductCategoryDto) {
    return this.service.create(dto);
  }

  /**
   * Get ProductCategories
   */
  @Get()
  @Permissions('PRODUCT_CATEGORY_VIEW')
  @ApiOperation({ summary: 'Get product-category list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT_CATEGORY.FETCHED,
      data: [
        {
          categoryId: 'CAT-001',
          name: 'Dairy',
          parentCategoryId: 'CAT-ROOT',
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
    PRODUCT_CATEGORY.FETCHED,
  )
  async findAll(@Query() query: ProductCategoryQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get ProductCategory by ID
   */
  @Permissions('PRODUCT_CATEGORY_VIEW')
  @Get(':categoryId')
  @ApiOperation({ summary: 'Get product-category by ID' })
  @ApiParam({ name: 'categoryId', description: 'ProductCategory categoryId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT_CATEGORY.FETCHED,
      data: {
        categoryId: 'CAT-001',
        name: 'Dairy',
        parentCategoryId: 'CAT-ROOT',
        status: 'ACTIVE',
      },
    },
    PRODUCT_CATEGORY.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('categoryId') categoryId: string) {
    return this.service.findByCategoryId(categoryId);
  }

  /**
   * Update ProductCategory
   */
  @Permissions('PRODUCT_CATEGORY_UPDATE')
  @Patch(':categoryId')
  @ApiOperation({ summary: 'Update product-category' })
  @ApiParam({ name: 'categoryId', description: 'ProductCategory categoryId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT_CATEGORY.UPDATED,
      data: {
        categoryId: 'CAT-001',
        name: 'Updated Category',
        status: 'ACTIVE',
      },
    },
    PRODUCT_CATEGORY.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('categoryId') categoryId: string, @Body() dto: UpdateProductCategoryDto) {
    return this.service.update(categoryId, dto);
  }

  /**
   * Delete ProductCategory
   */
  @Permissions('PRODUCT_CATEGORY_DELETE')
  @Delete(':categoryId')
  @ApiOperation({ summary: 'Delete product-category' })
  @ApiParam({ name: 'categoryId', description: 'ProductCategory categoryId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: PRODUCT_CATEGORY.DELETED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    PRODUCT_CATEGORY.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('categoryId') categoryId: string) {
    return this.service.delete(categoryId);
  }
}
