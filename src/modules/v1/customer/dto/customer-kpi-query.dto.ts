import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerKpiQueryDto {
  @ApiProperty({ example: 'CUST001', required: true })
  @IsNotEmpty()
  @IsString()
  customerId!: string;
}
