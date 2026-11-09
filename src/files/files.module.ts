import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FilesController } from './controllers/files.controller';
import { UploadedFile, UploadedFileSchema } from './entities/file.entity';
import { FilesRepository } from './repositories/files.repository';
import { FilesService } from './services/files.service';
import { CLOUD_STORAGE } from './storage/cloud-storage';
import { GcsStorageService } from './storage/gcs-storage.service';

@Module({ imports: [AuthModule, MongooseModule.forFeature([{ name: UploadedFile.name, schema: UploadedFileSchema }])], controllers: [FilesController], providers: [FilesRepository, FilesService, { provide: CLOUD_STORAGE, useClass: GcsStorageService }] })
export class FilesModule {}
