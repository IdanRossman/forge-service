import { Injectable } from '@nestjs/common';
import { getCubeRates } from '../data/cube-rates';

@Injectable()
export class CubeRatesDataService {
  private cubeRatesData: any = null;

  getCubeRates() {
    if (!this.cubeRatesData) {
      this.cubeRatesData = getCubeRates();
    }
    return this.cubeRatesData;
  }
}
