import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Employee, EmployeeSchema } from 'src/core/database/mongo/schema/employee.schema';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    UserModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
