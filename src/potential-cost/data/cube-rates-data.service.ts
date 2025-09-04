import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CubeRatesDataService {
  private cubeRates: any;

  constructor() {
    this.loadCubeRates();
  }

  private loadCubeRates(): void {
    try {
      // Read the file content directly
      const filePath = path.join(process.cwd(), 'cubeRates.js.broken');
      let content = fs.readFileSync(filePath, 'utf8');

      // Remove any corrupted module.exports lines
      content = content.replace(/module\.exports.*$/gm, '');
      content = content.replace(/m o d u l e.*$/gm, '');

      // Clean up any weird characters at the end
      content = content.trim();

      // Add proper export
      content += '\nmodule.exports = cubeRates;';

      // Write to a temporary file and require it
      const tempFile = path.join(process.cwd(), 'temp-cube-rates.js');
      fs.writeFileSync(tempFile, content, 'utf8');

      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
      this.cubeRates = require(tempFile);

      // Clean up temp file
      fs.unlinkSync(tempFile);

      console.log('✅ Cube rates loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load cube rates:', (error as Error).message);
      throw error;
    }
  }

  getCubeRates(): any {
    return this.cubeRates;
  }
}
