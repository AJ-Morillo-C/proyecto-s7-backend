import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiMetadataService } from './ai-metadata.service';

@Module({
  imports: [ConfigModule],
  providers: [AiMetadataService],
  exports: [AiMetadataService],
})
export class AiMetadataModule {}
