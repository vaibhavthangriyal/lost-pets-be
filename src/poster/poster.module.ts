import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PetPost, PetPostSchema } from '../pets/entities/pet-post.entity';
import { PosterController } from './poster.controller';
import { Poster, PosterSchema } from './entities/poster.entity';
import { PosterService } from './poster.service';
import { MetaModule } from '../meta/meta.module';

@Module({ imports: [AuthModule, MetaModule, MongooseModule.forFeature([{ name: Poster.name, schema: PosterSchema }, { name: PetPost.name, schema: PetPostSchema }])], controllers: [PosterController], providers: [PosterService] })
export class PosterModule {}
