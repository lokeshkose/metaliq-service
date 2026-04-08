import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Version, VersionSchema } from 'src/core/database/mongo/schema/version.schema';
import { VersionController } from './version.controller';
import { VersionService } from './version.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Version.name, schema: VersionSchema }])],
  controllers: [VersionController],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionModule {}
