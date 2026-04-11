/**
 * Employee Controller
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
   */
  @Permissions('EMPLOYEE_CREATE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 201,
      message: EMPLOYEE.CREATED,
      data: {
        employeeId: 'EMPL-001',
      },
    },
    EMPLOYEE.CREATED,
    HttpStatus.CREATED,
  )
  async create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  /**
   * Get Employees
   */
  @Get()
  @Permissions('EMPLOYEE_VIEW')
  @ApiOperation({ summary: 'Get employee list with pagination' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: EMPLOYEE.FETCHED,
      data: [
        {
          employeeId: 'EMPL-001',
          name: 'John Doe',
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
    EMPLOYEE.FETCHED,
  )
  async findAll(@Query() query: EmployeeQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * Employee KPI
   */
  @Permissions('EMPLOYEE_VIEW')
  @Get('kpi')
  @ApiOperation({ summary: 'Get employee KPI' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: EMPLOYEE.KPI_FETCHED,
      data: {
        weekRange: {
          start: '2026-04-07T00:00:00.000Z',
          end: '2026-04-13T23:59:59.999Z',
        },
        overall: {
          totalInquiries: 25,
          pendingInquiryCount: 10,
          customerCount: 50,
          productCount: 100,
          categoryCount: 12,
          statusCounts: {
            PENDING: 10,
            CLOSED: 5,
            REJECTED: 2,
            RESPONDED: 7,
            CANCELLED: 1,
          },
        },
        thisWeek: {
          totalInquiries: 8,
          pendingInquiryCount: 3,
          customerCount: 6,
          productCount: 4,
          statusCounts: {
            PENDING: 3,
            CLOSED: 2,
            REJECTED: 0,
            RESPONDED: 2,
            CANCELLED: 1,
          },
        },
      },
    },
    EMPLOYEE.KPI_FETCHED,
  )
  async getKpi(@Query('employeeId') employeeId?: string) {
    return this.service.getEmployeeKpi({ employeeId });
  }

  /**
   * Get Employee by ID
   */
  @Permissions('EMPLOYEE_VIEW')
  @Get(':employeeId')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee employeeId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: EMPLOYEE.FETCHED,
      data: {
        employeeId: 'EMPL-001',
        name: 'John Doe',
        mobile: '9876543210',
        email: 'john@mail.com',
        status: 'ACTIVE',
      },
    },
    EMPLOYEE.FETCHED,
  )
  @ApiNotFoundResponse()
  async findOne(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployeeId(employeeId);
  }

  /**
   * Update Employee
   */
  @Permissions('EMPLOYEE_UPDATE')
  @Patch(':employeeId')
  @ApiOperation({ summary: 'Update employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee employeeId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: EMPLOYEE.UPDATED,
      data: {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      },
    },
    EMPLOYEE.UPDATED,
  )
  @ApiNotFoundResponse()
  async update(@Param('employeeId') employeeId: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(employeeId, dto);
  }

  /**
   * Delete Employee
   */
  @Permissions('EMPLOYEE_DELETE')
  @Delete(':employeeId')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee employeeId' })
  @ApiSuccessResponse(
    {
      success: true,
      statusCode: 200,
      message: EMPLOYEE.DELETED,
      data: {
        employeeId: 'EMPL-001',
        name: 'John Doe',
        status: 'INACTIVE',
      },
    },
    EMPLOYEE.DELETED,
  )
  @ApiNotFoundResponse()
  async delete(@Param('employeeId') employeeId: string) {
    return this.service.delete(employeeId);
  }
}
