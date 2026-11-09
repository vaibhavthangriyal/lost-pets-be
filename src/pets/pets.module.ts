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
import { OwnedPet, OwnedPetSchema } from './entities/owned-pet.entity';
import { OwnedPetController } from './controllers/owned-pet.controller';
import { OwnedPetRepository } from './repositories/owned-pet.repository';
import { OwnedPetService } from './services/owned-pet.service';

@Module({
    imports: [
        AuthModule,
        MongooseModule.forFeature([
            { name: PetPost.name, schema: PetPostSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: AlertPreference.name, schema: AlertSchema },
            { name: OwnedPet.name, schema: OwnedPetSchema }])
    ],
    controllers: [PostsController, AlertsController, OwnedPetController],
    providers: [PetsService, PetsRepository, OwnedPetService, OwnedPetRepository]
})
export class PetsModule { }
