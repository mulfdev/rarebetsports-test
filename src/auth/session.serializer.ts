import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { User as UserEntity } from '../users/users.entity';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(
    user: Omit<UserEntity, 'password'>,
    done: (err: any, id?: any) => void,
  ) {
    done(null, user.userId);
  }

  async deserializeUser(
    id: number,
    done: (err: any, user?: Omit<UserEntity, 'password'> | null) => void,
  ) {
    try {
      const userEntity = await this.usersService.findById(id);

      if (userEntity) {
        const { password, ...userWithoutPassword } = userEntity;
        done(null, userWithoutPassword);
      } else {
        done(null, null);
      }
    } catch (error) {
      done(error, null);
    }
  }
}
