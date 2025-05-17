import {
  IsNotEmpty,
  IsDateString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = args.object[relatedPropertyName];
    if (!relatedValue || !propertyValue) {
      return true;
    }
    return new Date(propertyValue) > new Date(relatedValue);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `"${args.property}" must be after "${relatedPropertyName}"`;
  }
}

export class CreateSleepDto {
  @IsNotEmpty({ message: 'Date of sleep should not be empty.' })
  @IsDateString(
    {},
    {
      message:
        'Date of sleep must be a valid ISO 8601 date string (e.g., YYYY-MM-DD).',
    },
  )
  dateOfSleep: string;

  @IsNotEmpty({ message: 'Sleep time should not be empty.' })
  @IsDateString(
    {},
    { message: 'Sleep time must be a valid ISO 8601 date string.' },
  )
  sleepTime: string;

  @IsNotEmpty({ message: 'Wake up time should not be empty.' })
  @IsDateString(
    {},
    { message: 'Wake up time must be a valid ISO 8601 date string.' },
  )
  @Validate(IsAfterConstraint, ['sleepTime'])
  wakeUpTime: string;
}
