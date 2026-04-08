/**
 * Login DTOs
 * ----------
 * Purpose : Define and validate login request payload
 * Used by : AUTHENTICATION / LOGIN FLOWS
 *
 * Supports:
 * - User authentication via loginId and password
 * - Device-level session binding
 * - Security auditing and push notification setup
 *
 * Notes:
 * - Device information is mandatory for login
 * - Passwords are transmitted in plain text and hashed internally
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsObject,
  ValidateNested,
  IsOptional,
  IsIn,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserType } from 'src/shared/enums/user.enums';

/**
 * Login Request DTO
 * -----------------
 * Purpose : Authenticate user and bind session to a device
 * Used by : LOGIN / AUTHENTICATION APIs
 *
 * Flow:
 * - Validate credentials
 * - Validate device information
 * - Create authenticated session
 */
export class CreateUserDto {
  /**
   * Login ID
   * --------
   * Purpose : Unique user identifier
   *
   * Examples:
   * - Username
   * - Employee code
   * - Customer code
   */
  @ApiProperty({
    example: 'EMP00123',
    description: 'Login ID / Username / Employee or Customer Code',
  })
  @IsString({ message: 'Login ID must be a string' })
  @IsNotEmpty({ message: 'Login ID is required' })
  @MinLength(3, { message: 'Login ID must be at least 3 characters' })
  @MaxLength(50, { message: 'Login ID must not exceed 50 characters' })
  loginId!: string;

  /**
   * Password
   * --------
   * Purpose : User authentication secret
   *
   * Notes:
   * - Plain text in request
   * - Securely hashed internally
   */
  @ApiProperty({
    example: 'Passw0rd@123',
    description: 'User password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({
    example: 'PRID0001',
    description: 'Profile ID',
  })
  @IsNotEmpty({ message: 'ProfileId is required' })
  profileId!: string;

  @ApiProperty({
    example: '8777777777',
    description: '10 digit mobile number',
  })
  @IsNotEmpty({ message: 'Mobile is required' })
  @MinLength(10, { message: 'Mobile must be at least 10 characters' })
  mobile!: string;

  @ApiPropertyOptional({
    enum: UserType,
    example: UserType.CUSTOMER,
    default: UserType.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserType)
  userType!: UserType;

  @ApiProperty({
    example: 'Email - test@gmail.com',
    description: 'Enter valid email',
  })
  @IsOptional()
  email?: string;
}
