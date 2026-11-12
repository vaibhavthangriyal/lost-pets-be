import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: true, credentials: true } })
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  constructor(private jwt: JwtService) {}
  async handleConnection(client: Socket) {
    try {
      const token = typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : '';
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      if (!payload.sub) throw new Error('Missing user');
      client.data.userId = payload.sub;
      await client.join(this.room(payload.sub));
    } catch { client.disconnect(true); }
  }
  room(userId: string) { return `user:${userId}`; }
}
