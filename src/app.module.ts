import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { FilesModule } from './files/files.module';
import { MetaModule } from './meta/meta.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PosterModule } from './poster/poster.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({ useFactory: () => ({ uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/lost-pets' }) }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule, PetsModule, FilesModule, MetaModule, NotificationsModule, PosterModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
