import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtStrategy } from './jwt.strategy';
import { jwtConfig } from '../../../core/config/jwt.config';

import { User, UserSchema } from 'src/core/database/mongo/schema/user.schema';
import { Employee, EmployeeSchema } from 'src/core/database/mongo/schema/employee.schema';
import { Customer, CustomerSchema } from 'src/core/database/mongo/schema/customer.schema';

import { DeviceModule } from '../device/device.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    PassportModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        ...jwtConfig,
      }),
    }),

    /* ======================================================
     * REGISTER ALL MODELS USED IN SERVICE 🔥
     * ====================================================== */
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Employee.name, schema: EmployeeSchema }, // ✅ ADD
      { name: Customer.name, schema: CustomerSchema }, // ✅ ADD
    ]),

    DeviceModule,
    RoleModule,
  ],

  controllers: [UserController],
  providers: [UserService, JwtStrategy],
  exports: [UserService],
})
export class UserModule {}
