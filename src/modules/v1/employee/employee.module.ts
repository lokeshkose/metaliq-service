import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Employee, EmployeeSchema } from 'src/core/database/mongo/schema/employee.schema';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { UserModule } from '../user/user.module';
import { CustomerModule } from '../customer/customer.module';
import { InquiryModule } from '../inquiry/inquiry.module';
import { ProductCategoryModule } from '../product-category/product-category.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    UserModule,
    CustomerModule,
    InquiryModule,
    ProductCategoryModule,
    ProductModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
