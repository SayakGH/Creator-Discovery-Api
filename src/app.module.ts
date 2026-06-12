import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CreatorsModule } from './creators/creators.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShortlistModule } from './shortlist/shortlist.module';

@Module({
  imports: [PrismaModule, AuthModule, CreatorsModule, ShortlistModule],
})
export class AppModule {}
