import { IsUUID } from 'class-validator';

export class AddToShortlistDto {
  @IsUUID()
  creatorId: string;
}
