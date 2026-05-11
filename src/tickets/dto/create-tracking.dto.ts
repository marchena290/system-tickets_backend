import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTrackingDto {
  @IsString()
  @IsNotEmpty()
  comment: string;

  // opcional: nuevo estado del ticket
  @IsString()
  newStatus?: string;
}
