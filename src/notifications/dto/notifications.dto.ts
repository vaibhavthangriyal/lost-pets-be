import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDefined, IsIn, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { PostType, postTypes } from '../../pets/entities/pet-post.entity';

class CoordinatesDto { @IsNumber() @IsLatitude() latitude: number; @IsNumber() @IsLongitude() longitude: number; }
export class LocationSettingsDto {
  @IsString() @Length(1, 80) name: string;
  @IsDefined() @ValidateNested() @Type(() => CoordinatesDto) location: CoordinatesDto;
  @IsNumber() @Min(1) @Max(100) radiusKm: number;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3) @IsIn(postTypes, { each: true }) types: PostType[];
  @IsOptional() @IsBoolean() active?: boolean;
}
export class PushDeviceDto {
  @IsString() @Length(1, 200) deviceId: string;
  @IsIn(['android', 'ios']) platform: string;
  @IsString() @Length(10, 500) pushToken: string;
}
export class AutomaticLocationDto {
  @IsDefined() @ValidateNested() @Type(() => CoordinatesDto) location: CoordinatesDto;
  @IsOptional() @IsIn(['account', 'post']) source?: 'account' | 'post';
}
