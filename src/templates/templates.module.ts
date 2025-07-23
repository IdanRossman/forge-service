import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplateService } from './template.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplatesController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplatesModule {}
