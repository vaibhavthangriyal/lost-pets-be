import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MetaMaster } from './entities/meta-master.entity';
import { MetaOption } from './entities/meta-option.entity';

type SeedOption = { value: string; label: string; sortOrder: number; parentValue?: string };
const seeds: Record<string, { label: string; options: SeedOption[] }> = {
  pet_type: { label: 'Pet type', options: [
    { value: 'dog', label: 'Dog', sortOrder: 1 }, { value: 'cat', label: 'Cat', sortOrder: 2 }, { value: 'cow', label: 'Cow', sortOrder: 3 },
  ] },
  post_type: { label: 'Post type', options: [
    { value: 'lost', label: 'Lost pet', sortOrder: 1 }, { value: 'sighting', label: 'Sighting', sortOrder: 2 }, { value: 'rescue', label: 'Found stray', sortOrder: 3 },
  ] },
  breed: { label: 'Breed', options: [
    { value: 'labrador_retriever', label: 'Labrador Retriever', parentValue: 'dog', sortOrder: 1 },
    { value: 'golden_retriever', label: 'Golden Retriever', parentValue: 'dog', sortOrder: 2 },
    { value: 'german_shepherd', label: 'German Shepherd', parentValue: 'dog', sortOrder: 3 },
    { value: 'french_bulldog', label: 'French Bulldog', parentValue: 'dog', sortOrder: 4 },
    { value: 'beagle', label: 'Beagle', parentValue: 'dog', sortOrder: 5 },
    { value: 'persian', label: 'Persian', parentValue: 'cat', sortOrder: 1 },
    { value: 'maine_coon', label: 'Maine Coon', parentValue: 'cat', sortOrder: 2 },
    { value: 'siamese', label: 'Siamese', parentValue: 'cat', sortOrder: 3 },
    { value: 'ragdoll', label: 'Ragdoll', parentValue: 'cat', sortOrder: 4 },
    { value: 'british_shorthair', label: 'British Shorthair', parentValue: 'cat', sortOrder: 5 },
    { value: 'bengal', label: 'Bengal', parentValue: 'cat', sortOrder: 6 },
  ] },
  currency: { label: 'Currency', options: [
    { value: 'INR', label: 'INR — Indian Rupee', sortOrder: 1 }, { value: 'USD', label: 'USD — US Dollar', sortOrder: 2 },
    { value: 'EUR', label: 'EUR — Euro', sortOrder: 3 }, { value: 'GBP', label: 'GBP — British Pound', sortOrder: 4 },
    { value: 'AUD', label: 'AUD — Australian Dollar', sortOrder: 5 }, { value: 'CAD', label: 'CAD — Canadian Dollar', sortOrder: 6 },
  ] },
};

@Injectable()
export class MetaService implements OnModuleInit {
  constructor(@InjectModel(MetaMaster.name) private masters: Model<MetaMaster>, @InjectModel(MetaOption.name) private options: Model<MetaOption>) {}
  async onModuleInit() { await this.seed(); }
  private async seed() {
    const masterIds = new Map<string, Types.ObjectId>();
    for (const [key, definition] of Object.entries(seeds)) {
      const master = await this.masters.findOneAndUpdate({ key }, { $set: { label: definition.label, active: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
      masterIds.set(key, master._id);
    }
    const petIds = new Map<string, Types.ObjectId>();
    for (const option of seeds.pet_type.options) {
      const saved = await this.upsertOption(masterIds.get('pet_type')!, option);
      petIds.set(option.value, saved._id);
    }
    for (const key of ['post_type', 'breed', 'currency']) for (const option of seeds[key].options) await this.upsertOption(masterIds.get(key)!, option, option.parentValue ? petIds.get(option.parentValue) : undefined);
  }
  private upsertOption(master: Types.ObjectId, option: SeedOption, parentOption?: Types.ObjectId) {
    return this.options.findOneAndUpdate({ master, value: option.value }, { $set: { label: option.label, sortOrder: option.sortOrder, active: true, ...(parentOption ? { parentOption } : {}) } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  async list() {
    const masters = await this.masters.find({ key: { $in: Object.keys(seeds) }, active: true }).lean();
    const byKey = new Map(masters.map(master => [master.key, master]));
    const options = await this.options.find({ master: { $in: masters.map(master => master._id) }, active: true }).sort({ sortOrder: 1, label: 1 }).lean();
    const petTypes = options.filter(option => option.master.equals(byKey.get('pet_type')!._id));
    const petValueById = new Map(petTypes.map(option => [option._id.toString(), option.value]));
    const shape = (option: typeof options[number]) => ({ value: option.value, label: option.label });
    return {
      petTypes: petTypes.map(shape),
      postTypes: options.filter(option => option.master.equals(byKey.get('post_type')!._id)).map(shape),
      breeds: options.filter(option => option.master.equals(byKey.get('breed')!._id)).map(option => ({ ...shape(option), petType: option.parentOption ? petValueById.get(option.parentOption.toString()) : undefined })),
      currencies: options.filter(option => option.master.equals(byKey.get('currency')!._id)).map(shape),
    };
  }
  async validatePost(postType: string, petType?: string, breed?: string) {
    const metadata = await this.list();
    if (!metadata.postTypes.some(option => option.value === postType)) throw new BadRequestException('Invalid post type');
    this.validateAnimalFrom(metadata, petType, breed);
  }
  async validateAnimal(petType: string, breed?: string) { this.validateAnimalFrom(await this.list(), petType, breed); }
  async validateCurrency(currency: string) { if (!(await this.list()).currencies.some(option => option.value === currency)) throw new BadRequestException('Invalid currency'); }
  private validateAnimalFrom(metadata: Awaited<ReturnType<MetaService['list']>>, petType?: string, breed?: string) {
    if (petType && !metadata.petTypes.some(option => option.value === petType)) throw new BadRequestException('Invalid animal type');
    if (breed && !metadata.breeds.some(option => option.value === breed && option.petType === petType)) throw new BadRequestException('Invalid breed for the selected animal type');
  }
}
