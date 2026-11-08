import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { AlertDto } from '../dto/pets.dto';
import { PETS_ROUTES } from '../routes/pets.routes';
import { PetsService } from '../services/pets.service';

@Controller(PETS_ROUTES.alerts) @UseGuards(AuthGuard)
export class AlertsController {
  constructor(private service: PetsService) {}
  @Get() get(@Req() req: any) { return this.service.getAlert(req.user.id); }
  @Post() update(@Req() req: any, @Body() dto: AlertDto) { return this.service.updateAlert(req.user.id, dto); }
  @Delete() delete(@Req() req: any) { return this.service.deleteAlert(req.user.id); }
}
