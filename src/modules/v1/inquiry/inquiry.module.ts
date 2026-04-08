import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Inquiry, InquirySchema } from 'src/core/database/mongo/schema/inquiry.schema';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Inquiry.name, schema: InquirySchema }])],
  controllers: [InquiryController],
  providers: [InquiryService],
  exports: [InquiryService],
})
export class InquiryModule {}
