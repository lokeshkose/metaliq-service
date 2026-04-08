/**
 * Company Controller
 * -------------------
 * Purpose : Exposes APIs for managing companys
 * Used by : WEB / MOBILE / ADMIN PANEL
 *
 * Responsibilities:
 * - Create companys
 * - Fetch companys with filters & pagination
 * - Retrieve individual company details
 * - Update company
 * - Soft delete companys
 *
 * Notes:
 * - Companys act as master reference data
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
   * --------------
   */
  @Permissions('COMPANY_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiSuccessResponse({ companyId: 'COMP-001' }, COMPANY.CREATED, HttpStatus.CREATED)
  async create(@Body() dto: CreateCompanyDto) {
    return this.service.create(dto);
  }

  /**
   * Get Companys
   * ------------
   */
  @Get()
  @Permissions('COMPANY_VIEW')
  async findAll(@Query() query: CompanyQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Company by ID
   * -----------------
   */
  @Permissions('COMPANY_VIEW')
  @Get(':companyId')
  @ApiParam({ name: 'companyId', description: 'Company companyId' })
  async findOne(@Param('companyId') companyId: string) {
    return this.service.findByCompanyId(companyId);
  }

  /**
   * Update Company
   * ---------------
   */
  @Permissions('COMPANY_UPDATE')
  @Patch(':companyId')
  @ApiParam({ name: 'companyId', description: 'Company companyId' })
  async update(@Param('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(companyId, dto);
  }

  /**
   * Delete Company
   * ---------------
   */
  @Permissions('COMPANY_DELETE')
  @Delete(':companyId')
  @ApiParam({ name: 'companyId', description: 'Company companyId' })
  async delete(@Param('companyId') companyId: string) {
    return this.service.delete(companyId);
  }
}
