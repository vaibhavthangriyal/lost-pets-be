import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsDefined, IsIn, IsLatitude, IsLongitude, IsMongoId, IsNumber, IsOptional, IsString, IsUrl, Length, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { PostType, postTypes } from '../entities/pet-post.entity';

export class LocationDto {
  @IsNumber() @IsLatitude() latitude: number;
  @IsNumber() @IsLongitude() longitude: number;
}
export class CreatePostDto {
  @IsIn(postTypes) type: PostType;
  @IsString() @Length(1, 120) title: string;
  @IsString() @Length(1, 5000) description: string;
  @IsOptional() @IsString() @MaxLength(80) species?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({ require_protocol: true }, { each: true }) photos?: string[];
  @IsDefined() @ValidateNested() @Type(() => LocationDto) location: LocationDto;
  @IsDateString() occurredAt: string;
  @IsOptional() @IsMongoId() relatedPostId?: string;
}
export class SearchDto {
  @IsOptional() @IsIn(postTypes) type?: PostType;
  @IsOptional() @IsIn(['active', 'resolved']) status?: string;
  @IsOptional() @Type(() => Number) @IsLatitude() latitude?: number;
  @IsOptional() @Type(() => Number) @IsLongitude() longitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100) radiusKm?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 0 }) @Min(1) @Max(100) limit?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 0 }) @Min(0) @Max(10000) skip?: number;
}
export class CommentDto { @IsString() @Length(1, 2000) text: string; }
export class StatusDto { @IsIn(['active', 'resolved']) status: string; }
export class AlertDto {
  @IsDefined() @ValidateNested() @Type(() => LocationDto) location: LocationDto;
  @IsNumber() @Min(1) @Max(100) radiusKm: number;
  @IsArray() @ArrayMaxSize(3) @IsIn(postTypes, { each: true }) types: PostType[];
}
