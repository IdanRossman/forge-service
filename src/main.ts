import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    console.log('🚀 Starting Forge Service...');
    console.log('Environment variables check:');
    console.log(
      '- SUPABASE_URL:',
      process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
    );
    console.log(
      '- SUPABASE_ANON_KEY:',
      process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    );
    console.log('- PORT:', process.env.PORT || '3000 (default)');

    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors();

    // Swagger Configuration
    const config = new DocumentBuilder()
      .setTitle('Forge Service API')
      .setDescription('MapleStory Starforce Enhancement Cost Calculator API')
      .setVersion('1.0')
      .addTag('starforce', 'Starforce cost calculation endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`✅ Application is running on: http://localhost:${port}`);
    console.log(
      `📖 Swagger documentation available at: http://localhost:${port}/api`,
    );
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

void bootstrap();
