import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isAuthenticated =
      request.isAuthenticated && request.isAuthenticated();

    if (isAuthenticated) {
      return true;
    }
    throw new UnauthorizedException('User is not authenticated');
  }
}
