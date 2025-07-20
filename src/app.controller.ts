import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Health Check' })
  getHealth() {
    return {
      status: 'healthy',
      service: 'Forge Service API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
