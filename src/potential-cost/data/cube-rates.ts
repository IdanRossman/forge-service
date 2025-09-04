// This file imports the cube rates data and exports it as a TypeScript module
import * as path from 'path';

let cubeRatesData: any = null;

export function getCubeRates() {
  if (!cubeRatesData) {
    try {
      // Read the original cubeRates.js file with require
      const cubeRatesPath = path.join(process.cwd(), 'cubeRates.js');

      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(cubeRatesPath)];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
      cubeRatesData = require(cubeRatesPath);

      if (!cubeRatesData) {
        throw new Error('cubeRates object is null or undefined');
      }
    } catch (error) {
      console.error('Failed to load cube rates:', error);
      throw new Error('Failed to load cube rates data');
    }
  }

  return cubeRatesData;
}

export type CubeRatesData = ReturnType<typeof getCubeRates>;
