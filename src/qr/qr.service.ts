import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  toDataUrl(value: string) {
    return QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: { dark: '#19152B', light: '#FFFFFFFF' },
    });
  }
}
