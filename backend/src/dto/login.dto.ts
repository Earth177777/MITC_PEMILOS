import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  password: string;
}