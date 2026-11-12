import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AutomaticLocationDto, LocationSettingsDto, PushDeviceDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('me') @UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}
  @Get('notification-locations') locations(@Req() req: any) { return this.service.listLocations(req.user.id); }
  @Post('notification-locations') createLocation(@Req() req: any, @Body() dto: LocationSettingsDto) { return this.service.createLocation(req.user.id, dto); }
  @Post('notification-locations/automatic') automaticLocation(@Req() req: any, @Body() dto: AutomaticLocationDto) { return this.service.saveAutomaticLocation(req.user.id, dto.location, dto.source); }
  @Patch('notification-locations/:id') updateLocation(@Req() req: any, @Param('id') id: string, @Body() dto: LocationSettingsDto) { return this.service.updateLocation(req.user.id, id, dto); }
  @Delete('notification-locations/:id') deleteLocation(@Req() req: any, @Param('id') id: string) { return this.service.deleteLocation(req.user.id, id); }
  @Post('push-devices') device(@Req() req: any, @Body() dto: PushDeviceDto) { return this.service.registerDevice(req.user.id, dto); }
  @Delete('push-devices/:deviceId') removeDevice(@Req() req: any, @Param('deviceId') deviceId: string) { return this.service.removeDevice(req.user.id, deviceId); }
  @Get('notifications') notifications(@Req() req: any, @Query('skip') skip?: string, @Query('limit') limit?: string) { return this.service.list(req.user.id, Number(skip) || 0, Number(limit) || 30); }
  @Get('notifications/unread-count') unread(@Req() req: any) { return this.service.unreadCount(req.user.id); }
  @Post('notifications/:id/open') open(@Req() req: any, @Param('id') id: string) { return this.service.open(req.user.id, id); }
  @Patch('notifications/read-all') readAll(@Req() req: any) { return this.service.readAll(req.user.id); }
}
