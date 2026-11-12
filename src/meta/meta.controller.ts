import { Controller, Get } from '@nestjs/common';
import { MetaService } from './meta.service';

@Controller('meta')
export class MetaController {
  constructor(private service: MetaService) {}
  @Get() list() { return this.service.list(); }
}
