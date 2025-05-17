import { IsOptional, IsDateString } from 'class-validator';

export class UpdateSleepDto {
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Date of sleep must be a valid ISO 8601 date string (e.g., YYYY-MM-DD).',
    },
  )
  dateOfSleep?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Sleep time must be a valid ISO 8601 date string.' },
  )
  sleepTime?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Wake up time must be a valid ISO 8601 date string.' },
  )
  wakeUpTime?: string;
}
