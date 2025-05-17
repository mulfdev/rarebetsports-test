import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username should not be empty.' })
  @IsString({ message: 'Username must be a string.' })
  @MinLength(3, { message: 'Username must be at least 3 characters long.' })
  @MaxLength(50, { message: 'Username must be at most 50 characters long.' })
  username: string;

  @IsNotEmpty({ message: 'Password should not be empty.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(12, { message: 'Password must be at least 12 characters long.' })
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters.' })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter.',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least one digit.',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/, {
    message: 'Password must contain at least one special character.',
  })
  password: string;
}
