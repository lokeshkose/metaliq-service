/**
 * Employee Controller
 * --------------------
 * Purpose : Exposes APIs for managing employees
 * Used by : WEB / MOBILE / ADMIN PANEL
 *
 * Responsibilities:
 * - Create employees
 * - Fetch employees with filters & pagination
 * - Retrieve individual employee details
 * - Update employee
 * - Soft delete employees
 *
 * Notes:
 * - Employees act as master reference data
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

import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { EMPLOYEE } from './employee.constants';

@ApiTags('Employee')
@FeatureFlag(API_MODULE_ENABLE_KEYS.EMPLOYEE)
@ApiUnauthorizedResponse()
@ApiUnprocessableEntityResponse()
@ApiInternalErrorResponse()
@Controller({
  path: API_MODULE.EMPLOYEE,
  version: V1,
})
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  /**
   * Create Employee
   * ---------------
   */
  @Permissions('EMPLOYEE_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiSuccessResponse({ employeeId: 'EMPL-001' }, EMPLOYEE.CREATED, HttpStatus.CREATED)
  async create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  /**
   * Get Employees
   * -------------
   */
  @Get()
  @Permissions('EMPLOYEE_VIEW')
  async findAll(@Query() query: EmployeeQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Get Employee by ID
   * ------------------
   */
  @Permissions('EMPLOYEE_VIEW')
  @Get(':employeeId')
  @ApiParam({ name: 'employeeId', description: 'Employee employeeId' })
  async findOne(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployeeId(employeeId);
  }

  /**
   * Update Employee
   * ----------------
   */
  @Permissions('EMPLOYEE_UPDATE')
  @Patch(':employeeId')
  @ApiParam({ name: 'employeeId', description: 'Employee employeeId' })
  async update(@Param('employeeId') employeeId: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(employeeId, dto);
  }

  /**
   * Delete Employee
   * ----------------
   */
  @Permissions('EMPLOYEE_DELETE')
  @Delete(':employeeId')
  @ApiParam({ name: 'employeeId', description: 'Employee employeeId' })
  async delete(@Param('employeeId') employeeId: string) {
    return this.service.delete(employeeId);
  }
}
