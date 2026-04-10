import { Module, MiddlewareConsumer, NestModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './core/config/env.validation';
import { mongoConfig } from './core/config/mongo.config';
import { AppLoggerModule } from './core/logger/logger.module';
import { LoggerService } from './core/logger/logger.service';
import { MetricsModule } from './core/metrics/metrics.module';
import { HealthModule } from './modules/v1/health/health.service';
import { SessionMiddleware } from './core/middlewares/session.middleware';
import { MongoService } from './core/database/mongo/mongo.service';
import { RedisRepository } from './core/database/radis/radis.repository';
import { AppControlService } from './core/config/app-control.service';
import { AppControlGuard } from './core/guards/app-control.guard';
import { JwtAuthGuard } from './core/guards/jwt.guard';
import { THROTTLE_LIMIT, THROTTLE_TTL } from './shared/constants/app.constants';
import { AuditLogsModule } from './modules/v1/audit-logs/audit-logs.module';
import { SeedsModule } from './core/seeds/seeds.module';
import { PermissionModule } from './modules/v1/permission/permission.module';
import { MediaModule } from './modules/v1/media/media.module';
import { RoleModule } from './modules/v1/role/role.module';
import { EmployeeModule } from './modules/v1/employee/employee.module';
import { NotificationModule } from './modules/v1/notification/notification.module';
import { ProductModule } from './modules/v1/product/product.module';
import { ProductCategoryModule } from './modules/v1/product-category/product-category.module';
import { CustomerModule } from './modules/v1/customer/customer.module';
import { PriceModule } from './modules/v1/price/price.module';
import { InquiryModule } from './modules/v1/inquiry/inquiry.module';
import { CompanyModule } from './modules/v1/company/company.module';
import { VersionModule } from './modules/v1/version/version.module';
import { DeviceModule } from './modules/v1/device/device.module';
import { RbacGuard } from './core/guards/rbac.guard';

@Global()
@Module({
  imports: [
    /* ================= CONFIG ================= */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      validationSchema: envValidationSchema,
    }),

    /* ================= LOGGER ================= */
    AppLoggerModule,

    /* ================= DATABASE ================= */
    MongooseModule.forRootAsync({
      imports: [AppLoggerModule],
      inject: [ConfigService, LoggerService],
      useFactory: (config: ConfigService, logger: LoggerService) =>
        mongoConfig(config.get('MONGO_URI')!, logger),
    }),

    /* ================= RATE LIMITING ================= */
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: THROTTLE_TTL, limit: THROTTLE_LIMIT }],
    }),

    /* ================= FEATURE MODULES ================= */
    MetricsModule,
    HealthModule,
    AuditLogsModule,
    RoleModule,
    SeedsModule,
    PermissionModule,
    MediaModule,
    EmployeeModule,
    // NotificationModule,
    ProductModule,
    ProductCategoryModule,
    CustomerModule,
    PriceModule,
    InquiryModule,
    CompanyModule,
    VersionModule,
    DeviceModule,
  ],
  providers: [
    AppControlService,
    MongoService,
    RedisRepository,

    /* ===== GLOBAL FEATURE FLAG GUARD ===== */
    {
      provide: APP_GUARD,
      useClass: AppControlGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: RbacGuard,
    // },
  ],
  exports: [MongoService, RedisRepository],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
