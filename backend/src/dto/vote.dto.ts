import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CastVoteDto {
  @IsString()
  @IsNotEmpty({ message: 'Candidate ID is required' })
  candidateId: string;

  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  roomId: string;
}

export class AdminPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class RoomActionDto {
  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  roomId: string;
}