import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { MetaModule } from '../meta/meta.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AlertsController } from './controllers/alerts.controller';
import { PostsController } from './controllers/posts.controller';
import { AlertPreference, AlertSchema } from './entities/alert-preference.entity';
import { Comment, CommentSchema } from './entities/comment.entity';
import { PetPost, PetPostSchema } from './entities/pet-post.entity';
import { PetsRepository } from './repositories/pets.repository';
import { PetsService } from './services/pets.service';
import { PostsService } from './services/posts.service';
import { CommentsService } from './services/comments.service';
import { OwnedPet, OwnedPetSchema } from './entities/owned-pet.entity';
import { OwnedPetController } from './controllers/owned-pet.controller';
import { OwnedPetRepository } from './repositories/owned-pet.repository';
import { OwnedPetService } from './services/owned-pet.service';
import { ShortUrlModule } from '../short-url/short-url.module';

@Module({
    imports: [
        AuthModule,
        FilesModule,
        MetaModule,
        NotificationsModule,
        ShortUrlModule,
        MongooseModule.forFeature([
            { name: PetPost.name, schema: PetPostSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: AlertPreference.name, schema: AlertSchema },
            { name: OwnedPet.name, schema: OwnedPetSchema }])
    ],
    controllers: [PostsController, AlertsController, OwnedPetController],
    providers: [PetsService, PostsService, CommentsService, PetsRepository, OwnedPetService, OwnedPetRepository]
})
export class PetsModule { }
