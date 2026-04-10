import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Customer, CustomerSchema } from 'src/core/database/mongo/schema/customer.schema';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { UserModule } from '../user/user.module';
import { Inquiry, InquirySchema } from 'src/core/database/mongo/schema/inquiry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Inquiry.name, schema: InquirySchema },
    ]),
    UserModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
