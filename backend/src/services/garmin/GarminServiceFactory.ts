import { GarminProvider } from './GarminProvider.js';
import { GarminOfficialService } from './GarminOfficialService.js';
import { GarminMockService } from './GarminMockService.js';

export class GarminServiceFactory {
  static getProvider(): GarminProvider {
    const mode = (process.env.GARMIN_MODE || 'mock').toLowerCase();
    if (mode === 'production') {
      return new GarminOfficialService();
    }
    return new GarminMockService();
  }
}
