/**
 * Customer Controller
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

import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CUSTOMER } from './customer.constants';
import { CustomerKpiQueryDto } from './dto/customer-kpi-query.dto';
import { Public } from 'src/core/decorators/public.decorator';

@ApiTags('Customer')
@FeatureFlag(API_MODULE_ENABLE_KEYS.CUSTOMER)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.CUSTOMER,
  version: V1,
})
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  /**
   * Create Customer
   */
  @Public()
  @Permissions('CUSTOMER_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: CUSTOMER.CREATED,
      data: {
        customerId: 'CUST-001',
      },
    },
    CUSTOMER.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  /**
   * Customer KPI
   */
  @Permissions('EMPLOYEE_VIEW')
  @Get('kpi')
  @ApiOperation({ summary: 'Get customer KPI' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: CUSTOMER.KPI_FETCHED,
      data: {
        PENDING: 10,
        CLOSED: 5,
        REJECTED: 2,
        RESPONDED: 7,
        CANCELLED: 1,
        TOTAL: 25,
      },
    },
    CUSTOMER.KPI_FETCHED,
  )
  async getKpi(@Query() query: CustomerKpiQueryDto) {
    return this.service.getKpi(query);
  }

  /**
   * Get Customers
   */
  @Get()
  @Permissions('CUSTOMER_VIEW')
  @ApiOperation({ summary: 'Get customer list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: CUSTOMER.FETCHED,
      data: [
        {
          customerId: 'CUST-001',
          firstName: 'John',
          lastName: 'Doe',
          mobile: '9876543210',
          email: 'john@mail.com',
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
    CUSTOMER.FETCHED,
  )
  async findAll(@Query() query: CustomerQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Customer by ID
   */
  @Permissions('CUSTOMER_VIEW')
  @Get(':customerId')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'customerId', description: 'Customer customerId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: CUSTOMER.FETCHED,
      data: {
        customerId: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        mobile: '9876543210',
        email: 'john@mail.com',
        status: 'ACTIVE',
      },
    },
    CUSTOMER.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('customerId') customerId: string) {
    return this.service.findByCustomerId(customerId);
  }

  /**
   * Update Customer
   */
  @Permissions('CUSTOMER_UPDATE')
  @Patch(':customerId')
  @ApiOperation({ summary: 'Update customer' })
  @ApiParam({ name: 'customerId', description: 'Customer customerId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: CUSTOMER.UPDATED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    CUSTOMER.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('customerId') customerId: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(customerId, dto);
  }

  /**
   * Delete Customer
   */
  @Permissions('CUSTOMER_DELETE')
  @Delete(':customerId')
  @ApiOperation({ summary: 'Delete customer' })
  @ApiParam({ name: 'customerId', description: 'Customer customerId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: CUSTOMER.DELETED,
      data: {
        customerId: 'CUST-001',
        firstName: 'John',
        lastName: 'Doe',
        status: 'INACTIVE',
      },
    },
    CUSTOMER.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('customerId') customerId: string) {
    return this.service.delete(customerId);
  }
}
