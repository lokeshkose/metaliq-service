/**
 * Company Controller
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

import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { COMPANY } from './company.constants';

@ApiTags('Company')
@FeatureFlag(API_MODULE_ENABLE_KEYS.COMPANY)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.COMPANY,
  version: V1,
})
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  /**
   * Create Company
   */
  @Permissions('COMPANY_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: COMPANY.CREATED,
      data: {
        companyId: 'COMP-001',
      },
    },
    COMPANY.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateCompanyDto) {
    return this.service.create(dto);
  }

  /**
   * Get Companies
   */
  @Get()
  @Permissions('COMPANY_VIEW')
  @ApiOperation({ summary: 'Get company list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: COMPANY.FETCHED,
      data: [
        {
          companyId: 'COMP-001',
          name: 'ABC Pvt Ltd',
          description: 'Manufacturing company',
          email: 'abc@mail.com',
          mobile: '9876543210',
          gstNumber: '22ABCDE1234F1Z5',
          address: {
            line1: 'Street 1',
            line2: 'Area',
            city: 'Indore',
            state: 'MP',
            country: 'India',
            pincode: '452001',
          },
          services: ['Logistics'],
          courses: ['Training'],
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
    COMPANY.FETCHED,
  )
  async findAll(@Query() query: CompanyQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Company by ID
   */
  @Permissions('COMPANY_VIEW')
  @Get(':companyId')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'companyId', description: 'Company companyId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: COMPANY.FETCHED,
      data: {
        companyId: 'COMP-001',
        name: 'ABC Pvt Ltd',
        description: 'Manufacturing company',
        email: 'abc@mail.com',
        mobile: '9876543210',
        gstNumber: '22ABCDE1234F1Z5',
        address: {
          line1: 'Street 1',
          line2: 'Area',
          city: 'Indore',
          state: 'MP',
          country: 'India',
          pincode: '452001',
        },
        services: ['Logistics'],
        courses: ['Training'],
        status: 'ACTIVE',
      },
    },
    COMPANY.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('companyId') companyId: string) {
    return this.service.findByCompanyId(companyId);
  }

  /**
   * Update Company
   */
  @Permissions('COMPANY_UPDATE')
  @Patch(':companyId')
  @ApiOperation({ summary: 'Update company' })
  @ApiParam({ name: 'companyId', description: 'Company companyId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: COMPANY.UPDATED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    COMPANY.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(companyId, dto);
  }

  /**
   * Delete Company
   */
  @Permissions('COMPANY_DELETE')
  @Delete(':companyId')
  @ApiOperation({ summary: 'Delete company' })
  @ApiParam({ name: 'companyId', description: 'Company companyId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: COMPANY.DELETED,
      data: {
        companyId: 'COMP-001',
        name: 'ABC Pvt Ltd',
        status: 'INACTIVE',
      },
    },
    COMPANY.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('companyId') companyId: string) {
    return this.service.delete(companyId);
  }
}
