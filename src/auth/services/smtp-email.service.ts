import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { connect as connectNet, Socket } from 'node:net';
import { connect as connectTls, TLSSocket } from 'node:tls';
import { EmailMessage, EmailService } from './email.service';

type SmtpSocket = Socket | TLSSocket;

@Injectable()
export class SmtpEmailService implements EmailService {
  private readonly host     = process.env.SMTP_HOST!;
  private readonly port     = Number(process.env.SMTP_PORT || 465);
  private readonly secure   = (process.env.SMTP_SECURE || (this.port === 465 ? 'true' : 'false'))   === 'true';
  private readonly startTls = (process.env.SMTP_STARTTLS || (this.port === 587 ? 'true' : 'false')) === 'true';
  private readonly username = process.env.SMTP_USER!;
  private readonly password = process.env.SMTP_PASSWORD!;
  private readonly from     = process.env.SMTP_FROM!;

  async send(message: EmailMessage) {
    let socket: SmtpSocket | undefined;
    try {
      socket = await this.open();
      await this.command(socket, 'EHLO pawprint.local', 250);
      if (!this.secure && this.startTls) {
        await this.command(socket, 'STARTTLS', 220);
        socket = await this.upgradeToTls(socket);
        await this.command(socket, 'EHLO pawprint.local', 250);
      }
      await this.command(socket, 'AUTH LOGIN', 334);
      await this.command(socket, Buffer.from(this.username).toString('base64'), 334);
      await this.command(socket, Buffer.from(this.password).toString('base64'), 235);
      await this.command(socket, `MAIL FROM:<${this.from}>`, 250);
      await this.command(socket, `RCPT TO:<${message.to}>`, 250, 251);
      await this.command(socket, 'DATA', 354);
      await this.command(socket, this.mime(message), 250);
      await this.command(socket, 'QUIT', 221, 250);
    } catch (error) {
      throw new ServiceUnavailableException(`SMTP email delivery failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      socket?.destroy();
    }
  }

  private open(): Promise<SmtpSocket> {
    return new Promise((resolve, reject) => {
      const socket = this.secure ? connectTls({ host: this.host, port: this.port, servername: this.host }) : connectNet({ host: this.host, port: this.port });
      socket.once('error', reject);
      const connected = () => this.readResponse(socket).then(response => response.code === 220 ? resolve(socket) : reject(new Error(response.text))).catch(reject);
      socket.once(this.secure ? 'secureConnect' : 'connect', connected);
    });
  }

  private upgradeToTls(socket: SmtpSocket): Promise<TLSSocket> {
    return new Promise((resolve, reject) => {
      const tlsSocket = connectTls({ socket: socket as Socket, servername: this.host });
      tlsSocket.once('error', reject);
      tlsSocket.once('secureConnect', () => resolve(tlsSocket));
    });
  }

  private command(socket: SmtpSocket, command: string, ...expected: number[]) {
    return new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      socket.once('error', onError);
      socket.write(`${command}\r\n`, error => {
        if (error) return reject(error);
        this.readResponse(socket).then(response => {
          socket.removeListener('error', onError);
          if (!expected.includes(response.code)) return reject(new Error(response.text));
          resolve();
        }).catch(reject);
      });
    });
  }

  private readResponse(socket: SmtpSocket): Promise<{ code: number; text: string }> {
    return new Promise((resolve, reject) => {
      let buffer = '';
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        const line = lines.filter(item => /^\d{3}(?: |$)/.test(item)).at(-1);
        if (!line) return;
        socket.removeListener('data', onData);
        resolve({ code: Number(line.slice(0, 3)), text: line.slice(4) });
      };
      socket.once('error', reject);
      socket.on('data', onData);
    });
  }

  private mime(message: EmailMessage) {
    const contentType = message.html ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8';
    const body = message.html || message.text;
    return [`From: ${this.from}`, `To: ${message.to}`, `Subject: ${message.subject}`, 'MIME-Version: 1.0', `Content-Type: ${contentType}`, 'Content-Transfer-Encoding: 8bit', '', body.replace(/^\./gm, '..'), '.'].join('\r\n');
  }
}
