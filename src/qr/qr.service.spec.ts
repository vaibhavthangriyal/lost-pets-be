import { QrService } from './qr.service';

describe('QrService', () => {
  it('generates a PNG data URL for a short URL', async () => {
    const result = await new QrService().toDataUrl('https://pets.test/api/s/abc123');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
