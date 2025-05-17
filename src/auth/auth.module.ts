import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';
import { AuthController } from './auth.controller';
import { AuthenticatedGuard } from './authenticated.guard';

@Module({
  imports: [UsersModule, PassportModule.register({ session: true })],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
    AuthenticatedGuard,
  ],
  controllers: [AuthController],
  exports: [AuthenticatedGuard],
})
export class AuthModule {}
