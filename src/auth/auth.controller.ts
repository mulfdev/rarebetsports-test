import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  InternalServerErrorException,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { AuthenticatedGuard } from './authenticated.guard';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: ExpressRequest) {
    if (!req.user) throw new UnauthorizedException();

    const userToLogin = req.user;

    return new Promise((resolve, reject) => {
      req.login(userToLogin, (err: any) => {
        if (err) {
          console.error('Error during req.login:', err);
          return reject(
            new InternalServerErrorException('Failed to establish session.'),
          );
        }
        resolve({ message: 'Logged in successfully', user: req.user });
      });
    });
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() createUserDto: CreateUserDto) {
    await this.usersService.create(createUserDto);
    return { message: 'Signed up successfully!' };
  }

  @Get('profile')
  @UseGuards(AuthenticatedGuard)
  getProfile(@Request() req: ExpressRequest) {
    return req.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const sessionDestroyedPromise = new Promise<void>((resolve, reject) => {
      req.logout((logoutErr: any) => {
        if (logoutErr) {
          return reject(
            new InternalServerErrorException(
              'Logout failed during req.logout.',
            ),
          );
        }
        if (req.session) {
          req.session.destroy((destroyErr: any) => {
            if (destroyErr) {
              return reject(
                new InternalServerErrorException(
                  'Logout failed during session.destroy.',
                ),
              );
            }
            res.clearCookie('connect.sid');
            resolve();
          });
        } else {
          resolve();
        }
      });
    });

    try {
      await sessionDestroyedPromise;
      return { message: 'logged out' };
    } catch (error) {
      console.error('Logout process failed:', error);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during logout.',
      );
    }
  }
}
