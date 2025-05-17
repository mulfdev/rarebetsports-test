import * as session from 'express-session';
import * as passport from 'passport';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const sessionSecret = configService.get<string>('SESSION_SECRET');

  if (!sessionSecret) {
    throw new Error('SESSION_SECRET must be defined');
  }

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 * 7,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(3000);
}
bootstrap();
