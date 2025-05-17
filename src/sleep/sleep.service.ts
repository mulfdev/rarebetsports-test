import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { SleepEntry } from './sleep.entity';
import { CreateSleepDto } from './dto/create-sleep.dto';
import { UpdateSleepDto } from './dto/update-sleep.dto';

@Injectable()
export class SleepService {
  constructor(
    @Inject('SLEEP_ENTRY_REPOSITORY')
    private sleepRepository: Repository<SleepEntry>,
  ) {}

  async create(createSleepDto: CreateSleepDto, userId: number) {
    const { dateOfSleep, sleepTime, wakeUpTime } = createSleepDto;

    const sleepTimeDate = new Date(sleepTime);
    const wakeUpTimeDate = new Date(wakeUpTime);

    const durationInMilliseconds =
      wakeUpTimeDate.getTime() - sleepTimeDate.getTime();
    const durationInMinutes = Math.round(durationInMilliseconds / (1000 * 60));

    const newEntry = this.sleepRepository.create({
      dateOfSleep,
      sleepTime: sleepTimeDate,
      wakeUpTime: wakeUpTimeDate,
      durationInMinutes,
      userId,
    });

    return this.sleepRepository.save(newEntry);
  }

  async findAllByUserId(userId: number) {
    return this.sleepRepository.find({
      where: { userId },
      order: { dateOfSleep: 'DESC', sleepTime: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const entry = await this.sleepRepository.findOneBy({ id, userId });
    if (!entry) {
      throw new NotFoundException(
        `Sleep entry with ID "${id}" not found for this user.`,
      );
    }
    return entry;
  }

  async update(id: number, userId: number, updateSleepDto: UpdateSleepDto) {
    const entry: SleepEntry = await this.findOne(id, userId);

    const newSleepTime = updateSleepDto.sleepTime
      ? new Date(updateSleepDto.sleepTime)
      : entry.sleepTime;
    const newWakeUpTime = updateSleepDto.wakeUpTime
      ? new Date(updateSleepDto.wakeUpTime)
      : entry.wakeUpTime;

    if (updateSleepDto.sleepTime || updateSleepDto.wakeUpTime) {
      if (newWakeUpTime <= newSleepTime) {
        throw new BadRequestException('Wake up time must be after sleep time.');
      }
      const durationInMilliseconds =
        newWakeUpTime.getTime() - newSleepTime.getTime();
      entry.durationInMinutes = Math.round(
        durationInMilliseconds / (1000 * 60),
      );
    }

    if (updateSleepDto.dateOfSleep !== undefined) {
      entry.dateOfSleep = updateSleepDto.dateOfSleep;
    }
    if (updateSleepDto.sleepTime !== undefined) {
      entry.sleepTime = newSleepTime;
    }
    if (updateSleepDto.wakeUpTime !== undefined) {
      entry.wakeUpTime = newWakeUpTime;
    }

    return this.sleepRepository.save(entry);
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    const result = await this.sleepRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Failed to delete sleep entry with ID "${id}". Entry might have been deleted by another process.`,
      );
    }
  }

  async getWeeklyStats(userId: number) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setUTCHours(23, 59, 59, 999);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    startDate.setUTCHours(0, 0, 0, 0);

    const formatDate = (date: Date): string => date.toISOString().split('T')[0];

    const entries = await this.sleepRepository.find({
      where: {
        userId,
        dateOfSleep: Between(formatDate(startDate), formatDate(endDate)),
      },
      order: { dateOfSleep: 'ASC' },
    });

    const totalEntriesConsidered = entries.length;

    if (totalEntriesConsidered === 0) {
      return {
        averageSleepDurationMinutes: null,
        averageSleepTime: null,
        averageWakeUpTime: null,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        totalEntriesConsidered: 0,
      };
    }

    const totalDurationMinutes = entries.reduce(
      (sum, entry) => sum + entry.durationInMinutes,
      0,
    );
    const averageSleepDurationMinutes =
      totalEntriesConsidered > 0
        ? Math.round(totalDurationMinutes / totalEntriesConsidered)
        : null;

    let totalSleepTimeMinutesFromMidnight = 0;
    let totalWakeUpTimeMinutesFromMidnight = 0;

    for (const entry of entries) {
      const sleepTime = new Date(entry.sleepTime);
      const wakeUpTime = new Date(entry.wakeUpTime);

      totalSleepTimeMinutesFromMidnight +=
        sleepTime.getUTCHours() * 60 + sleepTime.getUTCMinutes();
      totalWakeUpTimeMinutesFromMidnight +=
        wakeUpTime.getUTCHours() * 60 + wakeUpTime.getUTCMinutes();
    }

    const formatMinutesToHHMM = (avgMinutes: number | null): string | null => {
      if (avgMinutes === null) return null;
      const hours = Math.floor(avgMinutes / 60);
      const minutes = Math.round(avgMinutes % 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0',
      )}`;
    };

    const averageSleepTimeMinutes =
      totalEntriesConsidered > 0
        ? totalSleepTimeMinutesFromMidnight / totalEntriesConsidered
        : null;
    const averageWakeUpTimeMinutes =
      totalEntriesConsidered > 0
        ? totalWakeUpTimeMinutesFromMidnight / totalEntriesConsidered
        : null;

    const averageSleepTime = formatMinutesToHHMM(averageSleepTimeMinutes);
    const averageWakeUpTime = formatMinutesToHHMM(averageWakeUpTimeMinutes);

    return {
      averageSleepDurationMinutes,
      averageSleepTime,
      averageWakeUpTime,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      totalEntriesConsidered,
    };
  }
}
