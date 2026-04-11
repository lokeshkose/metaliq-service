import { MongooseModuleOptions } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';
import { LoggerService } from 'src/core/logger/logger.service';
import { timestampsPlugin } from '../database/mongo/plugins/timestamps.plugin';
import { softDeletePlugin } from '../database/mongo/plugins/soft-delete.plugin';
import { auditPlugin } from '../database/mongo/plugins/audit-logs.plugin';
import { EmployeeSchema } from '../database/mongo/schema/employee.schema';
import { RoleSchema } from '../database/mongo/schema/role.schema';
import { InquirySchema } from '../database/mongo/schema/inquiry.schema';
import { PriceSchema } from '../database/mongo/schema/price.schema';
import { ProductSchema } from '../database/mongo/schema/product.schema';
import { ProductCategorySchema } from '../database/mongo/schema/product-category.schema';
import { DeviceSchema } from '../database/mongo/schema/device.schema';
import { UserSchema } from '../database/mongo/schema/user.schema';

export const mongoConfig = (uri: string, logger: LoggerService): MongooseModuleOptions => ({
  uri,

  /* ==================== CONNECTION SAFETY ==================== */
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,

  autoIndex: process.env.NODE_ENV !== 'production',

  connectionFactory: (connection: Connection) => {
    logger.setContext('MongoDB');

    /* ==================== GLOBAL PLUGINS ==================== */
    connection.plugin(timestampsPlugin);
    connection.plugin(softDeletePlugin);
    EmployeeSchema.plugin(auditPlugin, { entity: 'employees', primaryKey: 'employeeId' });
    InquirySchema.plugin(auditPlugin, { entity: 'inquires', primaryKey: 'inquiryId' });
    PriceSchema.plugin(auditPlugin, { entity: 'price_master', primaryKey: 'priceId' });
    ProductCategorySchema.plugin(auditPlugin, {
      entity: 'product_categories',
      primaryKey: 'categoryId',
    });
    ProductSchema.plugin(auditPlugin, { entity: 'product_master', primaryKey: 'productId' });
    RoleSchema.plugin(auditPlugin, { entity: 'roles', primaryKey: 'roleId' });
    DeviceSchema.plugin(auditPlugin, { entity: 'devices', primaryKey: 'deviceId' });
    UserSchema.plugin(auditPlugin, { entity: 'users', primaryKey: 'userId' });
    UserSchema.plugin(auditPlugin, { entity: 'company_master', primaryKey: 'companyId' });
    logger.info(`MongoDB initial readyState: ${connection.readyState}`);

    connection.once('open', () => {
      logger.info('MongoDB connection opened (READY)');
    });

    connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    connection.on('error', (err) => {
      logger.error('MongoDB connection error', err);
    });

    return connection;
  },
});
