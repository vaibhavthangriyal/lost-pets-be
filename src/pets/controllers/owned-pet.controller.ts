import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { OwnedPetDto } from '../dto/owned-pet.dto';
import { OWNED_PET_ROUTES } from '../routes/owned-pet.routes';
import { OwnedPetService } from '../services/owned-pet.service';

@Controller(OWNED_PET_ROUTES.base) @UseGuards(AuthGuard)
export class OwnedPetController {
  constructor(private service: OwnedPetService) {}
  @Get() list(@Req() req: any) { return this.service.list(req.user.id); }
  @Post() create(@Req() req: any, @Body() dto: OwnedPetDto) { return this.service.create(req.user.id, dto); }
  @Put(OWNED_PET_ROUTES.pet) update(@Req() req: any, @Param('id') id: string, @Body() dto: OwnedPetDto) { return this.service.update(req.user.id, id, dto); }
  @Delete(OWNED_PET_ROUTES.pet) delete(@Req() req: any, @Param('id') id: string) { return this.service.delete(req.user.id, id); }
}
