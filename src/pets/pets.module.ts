import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AlertsController } from './controllers/alerts.controller';
import { PostsController } from './controllers/posts.controller';
import { AlertPreference, AlertSchema } from './entities/alert-preference.entity';
import { Comment, CommentSchema } from './entities/comment.entity';
import { PetPost, PetPostSchema } from './entities/pet-post.entity';
import { PetsRepository } from './repositories/pets.repository';
import { PetsService } from './services/pets.service';

@Module({
    imports: [
        AuthModule,
        MongooseModule.forFeature([
            { name: PetPost.name, schema: PetPostSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: AlertPreference.name, schema: AlertSchema }])
    ],
    controllers: [PostsController, AlertsController],
    providers: [PetsService, PetsRepository]
})
export class PetsModule { }
