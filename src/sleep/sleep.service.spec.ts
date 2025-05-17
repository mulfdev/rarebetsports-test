import { Test, TestingModule } from '@nestjs/testing';
import { SleepService } from './sleep.service';
import { SleepEntry } from './sleep.entity';
import { Repository, Between } from 'typeorm';
import { CreateSleepDto } from './dto/create-sleep.dto';
import { UpdateSleepDto } from './dto/update-sleep.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SleepStatsDto } from './dto/sleep-stats.dto';

const mockSleepRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
};

const USER_ID = 1;

describe('SleepService', () => {
  let service: SleepService;
  let repository: Repository<SleepEntry>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SleepService,
        {
          provide: 'SLEEP_ENTRY_REPOSITORY',
          useValue: mockSleepRepository,
        },
      ],
    }).compile();

    service = module.get<SleepService>(SleepService);
    repository = module.get<Repository<SleepEntry>>('SLEEP_ENTRY_REPOSITORY');
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a sleep entry', async () => {
      const createSleepDto: CreateSleepDto = {
        dateOfSleep: '2024-05-15',
        sleepTime: '2024-05-15T22:00:00.000Z',
        wakeUpTime: '2024-05-16T06:00:00.000Z',
      };
      const expectedDuration =
        (new Date(createSleepDto.wakeUpTime).getTime() -
          new Date(createSleepDto.sleepTime).getTime()) /
        (1000 * 60);

      const mockEntry = {
        id: 1,
        userId: USER_ID,
        ...createSleepDto,
        durationInMinutes: expectedDuration,
      } as unknown as SleepEntry;

      mockSleepRepository.create.mockReturnValue(mockEntry);
      mockSleepRepository.save.mockResolvedValue(mockEntry);

      const result = await service.create(createSleepDto, USER_ID);

      expect(mockSleepRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dateOfSleep: createSleepDto.dateOfSleep,
          sleepTime: new Date(createSleepDto.sleepTime),
          wakeUpTime: new Date(createSleepDto.wakeUpTime),
          durationInMinutes: Math.round(expectedDuration),
          userId: USER_ID,
        }),
      );
      expect(mockSleepRepository.save).toHaveBeenCalledWith(mockEntry);
      expect(result).toEqual(mockEntry);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all sleep entries for a user', async () => {
      const mockEntries: SleepEntry[] = [
        { id: 1, userId: USER_ID, dateOfSleep: '2024-05-15' } as SleepEntry,
      ];
      mockSleepRepository.find.mockResolvedValue(mockEntries);

      const result = await service.findAllByUserId(USER_ID);
      expect(mockSleepRepository.find).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { dateOfSleep: 'DESC', sleepTime: 'DESC' },
      });
      expect(result).toEqual(mockEntries);
    });
  });

  describe('findOne', () => {
    it('should return a single sleep entry if found', async () => {
      const mockEntry = { id: 1, userId: USER_ID } as SleepEntry;
      mockSleepRepository.findOneBy.mockResolvedValue(mockEntry);

      const result = await service.findOne(1, USER_ID);
      expect(mockSleepRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        userId: USER_ID,
      });
      expect(result).toEqual(mockEntry);
    });

    it('should throw NotFoundException if entry not found', async () => {
      mockSleepRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(1, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing sleep entry', async () => {
      const existingEntry = {
        id: 1,
        userId: USER_ID,
        dateOfSleep: '2024-05-15',
        sleepTime: new Date('2024-05-15T22:00:00.000Z'),
        wakeUpTime: new Date('2024-05-16T06:00:00.000Z'),
        durationInMinutes: 480,
      } as SleepEntry;

      const updateDto: UpdateSleepDto = {
        dateOfSleep: '2024-05-16',
        wakeUpTime: '2024-05-16T07:00:00.000Z',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingEntry);
      mockSleepRepository.save.mockImplementation(async (entry) => entry);

      const result = await service.update(1, USER_ID, updateDto);

      const newWakeUpTime = new Date(updateDto.wakeUpTime!);
      const expectedDuration =
        (newWakeUpTime.getTime() - existingEntry.sleepTime.getTime()) /
        (1000 * 60);

      expect(service.findOne).toHaveBeenCalledWith(1, USER_ID);
      expect(mockSleepRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          dateOfSleep: updateDto.dateOfSleep,
          wakeUpTime: newWakeUpTime,
          durationInMinutes: Math.round(expectedDuration),
        }),
      );
      expect(result.dateOfSleep).toBe(updateDto.dateOfSleep);
      expect(result.wakeUpTime).toEqual(newWakeUpTime);
    });

    it('should throw BadRequestException if wakeUpTime is before sleepTime during update', async () => {
      const existingEntry = {
        id: 1,
        userId: USER_ID,
        sleepTime: new Date('2024-05-15T22:00:00.000Z'),
      } as SleepEntry;
      const updateDto: UpdateSleepDto = {
        wakeUpTime: '2024-05-15T21:00:00.000Z',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingEntry);

      await expect(service.update(1, USER_ID, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if entry to update not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
      const updateDto: UpdateSleepDto = { dateOfSleep: '2024-01-01' };
      await expect(service.update(99, USER_ID, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a sleep entry', async () => {
      const mockEntry = { id: 1, userId: USER_ID } as SleepEntry;
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEntry);
      mockSleepRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(1, USER_ID);
      expect(service.findOne).toHaveBeenCalledWith(1, USER_ID);
      expect(mockSleepRepository.delete).toHaveBeenCalledWith({
        id: 1,
        userId: USER_ID,
      });
    });

    it('should throw NotFoundException if entry to delete not found by findOne', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
      await expect(service.remove(1, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if delete operation affects 0 rows', async () => {
      const mockEntry = { id: 1, userId: USER_ID } as SleepEntry;
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEntry);
      mockSleepRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      await expect(service.remove(1, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWeeklyStats', () => {
    const MOCK_CURRENT_DATE = '2024-05-17T10:00:00.000Z';
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(MOCK_CURRENT_DATE));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const formatDate = (date: Date): string => date.toISOString().split('T')[0];

    it('should return null averages and zero entries if no sleep entries in the last week', async () => {
      mockSleepRepository.find.mockResolvedValue([]);

      const today = new Date(MOCK_CURRENT_DATE);
      const endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);

      const expectedStats: SleepStatsDto = {
        averageSleepDurationMinutes: null,
        averageSleepTime: null,
        averageWakeUpTime: null,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        totalEntriesConsidered: 0,
      };

      const result = await service.getWeeklyStats(USER_ID);

      expect(mockSleepRepository.find).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          dateOfSleep: Between(formatDate(startDate), formatDate(endDate)),
        },
        order: { dateOfSleep: 'ASC' },
      });
      expect(result).toEqual(expectedStats);
    });

    it('should calculate stats correctly for a single entry in the last week', async () => {
      const sleepTime = new Date('2024-05-15T22:00:00.000Z');
      const wakeUpTime = new Date('2024-05-16T06:00:00.000Z');
      const durationInMinutes =
        (wakeUpTime.getTime() - sleepTime.getTime()) / (1000 * 60);
      const entries: SleepEntry[] = [
        {
          id: 1,
          userId: USER_ID,
          dateOfSleep: '2024-05-15',
          sleepTime: sleepTime,
          wakeUpTime: wakeUpTime,
          durationInMinutes: durationInMinutes,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: null as any,
        },
      ];
      mockSleepRepository.find.mockResolvedValue(entries);

      const today = new Date(MOCK_CURRENT_DATE);
      const endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);

      const expectedStats: SleepStatsDto = {
        averageSleepDurationMinutes: durationInMinutes,
        averageSleepTime: '22:00',
        averageWakeUpTime: '06:00',
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        totalEntriesConsidered: 1,
      };

      const result = await service.getWeeklyStats(USER_ID);
      expect(result).toEqual(expectedStats);
    });

    it('should calculate stats correctly for multiple entries in the last week', async () => {
      const entries: SleepEntry[] = [
        {
          id: 1,
          userId: USER_ID,
          dateOfSleep: '2024-05-13',
          sleepTime: new Date('2024-05-13T21:00:00.000Z'),
          wakeUpTime: new Date('2024-05-14T05:00:00.000Z'),
          durationInMinutes: 8 * 60,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: null as any,
        },
        {
          id: 2,
          userId: USER_ID,
          dateOfSleep: '2024-05-15',
          sleepTime: new Date('2024-05-15T23:00:00.000Z'),
          wakeUpTime: new Date('2024-05-16T07:00:00.000Z'),
          durationInMinutes: 8 * 60,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: null as any,
        },
        {
          id: 3,
          userId: USER_ID,
          dateOfSleep: '2024-05-17',
          sleepTime: new Date('2024-05-17T00:30:00.000Z'),
          wakeUpTime: new Date('2024-05-17T08:30:00.000Z'),
          durationInMinutes: 8 * 60,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: null as any,
        },
      ];
      mockSleepRepository.find.mockResolvedValue(entries);

      const today = new Date(MOCK_CURRENT_DATE);
      const endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);

      const expectedStats: SleepStatsDto = {
        averageSleepDurationMinutes: 480,
        averageSleepTime: '14:50',
        averageWakeUpTime: '06:50',
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        totalEntriesConsidered: 3,
      };

      const result = await service.getWeeklyStats(USER_ID);
      expect(result).toEqual(expectedStats);
    });

    it('should exclude entries older than one week', async () => {
      const entries: SleepEntry[] = [
        {
          id: 1,
          userId: USER_ID,
          dateOfSleep: '2024-05-15',
          sleepTime: new Date('2024-05-15T22:00:00.000Z'),
          wakeUpTime: new Date('2024-05-16T06:00:00.000Z'),
          durationInMinutes: 480,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: null as any,
        },
      ];
      mockSleepRepository.find.mockResolvedValue([entries[0]]);

      const today = new Date(MOCK_CURRENT_DATE);
      const endDate = new Date(today);
      endDate.setUTCHours(23, 59, 59, 999);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);

      const result = await service.getWeeklyStats(USER_ID);

      expect(mockSleepRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dateOfSleep: Between(formatDate(startDate), formatDate(endDate)),
          }),
        }),
      );
      expect(result.totalEntriesConsidered).toBe(1);
      expect(result.averageSleepDurationMinutes).toBe(480);
    });
  });
});
