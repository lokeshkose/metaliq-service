import { Platform } from 'src/shared/enums/app.enums';
import { VersionStatus } from 'src/shared/enums/version.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * VersionQueryDto
 * =================
 * DTO for querying Version
 */
export class VersionQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by versionId or versionNumber',
    example: '1.2',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ example: '1.2.0' })
  @IsOptional()
  @IsString()
  versionNumber?: string;

  @ApiPropertyOptional({ enum: Platform })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  minSupportedVersion?: string;

  @ApiPropertyOptional({ enum: VersionStatus })
  @IsOptional()
  @IsEnum(VersionStatus)
  status?: VersionStatus;
}
