import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetaController } from './meta.controller';
import { MetaMaster, MetaMasterSchema } from './entities/meta-master.entity';
import { MetaOption, MetaOptionSchema } from './entities/meta-option.entity';
import { MetaService } from './meta.service';

@Module({ imports: [MongooseModule.forFeature([{ name: MetaMaster.name, schema: MetaMasterSchema }, { name: MetaOption.name, schema: MetaOptionSchema }])], controllers: [MetaController], providers: [MetaService], exports: [MetaService] })
export class MetaModule {}
