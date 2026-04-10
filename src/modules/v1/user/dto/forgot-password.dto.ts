// dto/forgot-password.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

// dto/reset-password.dto.ts
export class ResetPasswordDto {
  @IsNotEmpty()
  token!: string;

  @IsNotEmpty()
  password!: string;
}
