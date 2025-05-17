import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { User as UserEntity } from '../../users/users.entity';

export type AuthenticatedUserType = Omit<UserEntity, 'password'>;

export const AuthenticatedUser = createParamDecorator(
  (_, ctx: ExecutionContext): AuthenticatedUserType => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserType | undefined;

    if (!user) {
      throw new UnauthorizedException(
        'User not found on request. Ensure AuthenticatedGuard is used and user is properly deserialized.',
      );
    }
    return user;
  },
);
