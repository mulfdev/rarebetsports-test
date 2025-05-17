import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User as UserEntity } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<UserEntity>,
  ) {}

  async findOne(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto;

    const existingUser = await this.findOne(username);
    if (existingUser) {
      throw new BadRequestException('Username taken');
    }

    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findById(id: number) {
    return this.userRepository.findOne({ where: { userId: id } });
  }
}
