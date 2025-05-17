import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/users.entity';
import * as session from 'express-session';
import * as passport from 'passport';
import { ConfigService } from '@nestjs/config';
import { CreateSleepDto } from '../src/sleep/dto/create-sleep.dto';
import { UpdateSleepDto } from '../src/sleep/dto/update-sleep.dto';
import { SleepEntry } from 'src/sleep/sleep.entity';

describe('SleepController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;
  let configService: ConfigService;
  let agent: ReturnType<typeof request.agent>;
  let createdUserId: number;
  const testUserCredentials = {
    username: `sleep_tester_${Date.now()}`,
    password: 'Password123!',
  };
  let createdSleepEntryId: number;

  const getISODateString = (offsetDays = 0, hour = 0, minute = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    date.setUTCHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    configService = moduleFixture.get<ConfigService>(ConfigService);
    dataSource = moduleFixture.get<DataSource>('DATA_SOURCE');

    const sessionSecret = configService.get<string>('SESSION_SECRET');

    if (!sessionSecret) throw new Error('SESSION_SECRET must be defined');

    app.use(
      session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false, sameSite: 'lax' },
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());

    server = app.getHttpServer();
    await app.init();

    await request(server)
      .post('/auth/signup')
      .send(testUserCredentials)
      .expect(HttpStatus.CREATED);

    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOneBy({
      username: testUserCredentials.username,
    });
    expect(user).toBeDefined();
    createdUserId = user!.userId;

    agent = request.agent(server);
    await agent
      .post('/auth/login')
      .send(testUserCredentials)
      .expect(HttpStatus.CREATED);
  });

  afterAll(async () => {
    if (createdUserId) {
      const userRepository = dataSource.getRepository(User);
      await userRepository.delete({ userId: createdUserId });
    }
    await app.close();
  });

  describe('POST /sleep - Create Sleep Entry', () => {
    it('should create a new sleep entry for the authenticated user', async () => {
      const sleepTime = getISODateString(0, 22);
      const wakeUpTime = getISODateString(1, 6);
      const dateOfSleep = sleepTime.substring(0, 10);

      const createSleepDto: CreateSleepDto = {
        dateOfSleep: dateOfSleep,
        sleepTime: sleepTime,
        wakeUpTime: wakeUpTime,
      };

      const response = await agent
        .post('/sleep')
        .send(createSleepDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.dateOfSleep).toEqual(createSleepDto.dateOfSleep);
      expect(new Date(response.body.sleepTime).toISOString()).toEqual(
        createSleepDto.sleepTime,
      );
      expect(new Date(response.body.wakeUpTime).toISOString()).toEqual(
        createSleepDto.wakeUpTime,
      );
      expect(response.body.userId).toEqual(createdUserId);
      expect(response.body.durationInMinutes).toBeGreaterThan(0);
      createdSleepEntryId = response.body.id;
    });

    it('should fail if wakeUpTime is not after sleepTime', async () => {
      const sleepTime = getISODateString(0, 23);
      const wakeUpTime = getISODateString(0, 22);
      const dateOfSleep = sleepTime.substring(0, 10);

      const createSleepDto: CreateSleepDto = {
        dateOfSleep: dateOfSleep,
        sleepTime: sleepTime,
        wakeUpTime: wakeUpTime,
      };

      await agent
        .post('/sleep')
        .send(createSleepDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if not authenticated', async () => {
      await request(server)
        .post('/sleep')
        .send({
          dateOfSleep: '2023-01-01',
          sleepTime: '2023-01-01T22:00:00Z',
          wakeUpTime: '2023-01-02T06:00:00Z',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /sleep - Get Sleep Entries', () => {
    it('should get all sleep entries for the authenticated user', async () => {
      expect(createdSleepEntryId).toBeDefined();

      const response = await agent.get('/sleep').expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      if (response.body.length > 0) {
        expect(response.body[0].userId).toEqual(createdUserId);
      }
    });

    it('should fail if not authenticated', async () => {
      await request(server).get('/sleep').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /sleep/:id - Get Single Sleep Entry', () => {
    it('should get a specific sleep entry by ID for the authenticated user', async () => {
      expect(createdSleepEntryId).toBeDefined();
      const response = await agent
        .get(`/sleep/${createdSleepEntryId}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toEqual(createdSleepEntryId);
      expect(response.body.userId).toEqual(createdUserId);
    });

    it('should return 404 if entry not found or not owned by user', async () => {
      await agent.get(`/sleep/999999`).expect(HttpStatus.NOT_FOUND);
    });

    it('should fail if not authenticated', async () => {
      expect(createdSleepEntryId).toBeDefined();
      await request(server)
        .get(`/sleep/${createdSleepEntryId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH /sleep/:id - Update Sleep Entry', () => {
    it('should update a specific sleep entry for the authenticated user', async () => {
      expect(createdSleepEntryId).toBeDefined();
      const newDateOfSleep = getISODateString(2).substring(0, 10);
      const updateDto: UpdateSleepDto = { dateOfSleep: newDateOfSleep };

      const response = await agent
        .patch(`/sleep/${createdSleepEntryId}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.id).toEqual(createdSleepEntryId);
      expect(response.body.dateOfSleep).toEqual(newDateOfSleep);
    });

    it('should fail to update if wakeUpTime is not after sleepTime', async () => {
      expect(createdSleepEntryId).toBeDefined();
      const existingEntryRes = await agent
        .get(`/sleep/${createdSleepEntryId}`)
        .expect(HttpStatus.OK);
      const existingSleepTime = existingEntryRes.body.sleepTime;

      const updateDto: UpdateSleepDto = {
        wakeUpTime: new Date(
          new Date(existingSleepTime).getTime() - 60 * 60 * 1000,
        ).toISOString(),
      };

      await agent
        .patch(`/sleep/${createdSleepEntryId}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 if trying to update non-existent or non-owned entry', async () => {
      await agent
        .patch(`/sleep/999999`)
        .send({ dateOfSleep: '2023-01-01' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail if not authenticated', async () => {
      expect(createdSleepEntryId).toBeDefined();
      await request(server)
        .patch(`/sleep/${createdSleepEntryId}`)
        .send({ dateOfSleep: '2023-01-01' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /sleep/:id - Delete Sleep Entry', () => {
    it('should delete a specific sleep entry for the authenticated user', async () => {
      expect(createdSleepEntryId).toBeDefined();
      await agent
        .delete(`/sleep/${createdSleepEntryId}`)
        .expect(HttpStatus.NO_CONTENT);

      await agent
        .get(`/sleep/${createdSleepEntryId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 if trying to delete non-existent or non-owned entry', async () => {
      await agent.delete(`/sleep/999999`).expect(HttpStatus.NOT_FOUND);
    });

    it('should fail if not authenticated', async () => {
      await request(server)
        .delete(`/sleep/12345`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /sleep/stats/weekly - Get Weekly Sleep Stats', () => {
    const createSampleSleepEntry = async (
      dateOfSleepISO: string,
      sleepTimeISO: string,
      wakeUpTimeISO: string,
    ) => {
      const createSleepDto: CreateSleepDto = {
        dateOfSleep: dateOfSleepISO,
        sleepTime: sleepTimeISO,
        wakeUpTime: wakeUpTimeISO,
      };
      return agent
        .post('/sleep')
        .send(createSleepDto)
        .expect(HttpStatus.CREATED);
    };

    const getWeekDates = (referenceDate: Date) => {
      const endDate = new Date(referenceDate);
      endDate.setUTCHours(23, 59, 59, 999);

      const startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);

      const formatDate = (date: Date): string =>
        date.toISOString().split('T')[0];
      return {
        startDateString: formatDate(startDate),
        endDateString: formatDate(endDate),
      };
    };

    beforeAll(async () => {
      const sleepRepo = dataSource.getRepository(SleepEntry);
      const entries = await sleepRepo.find({
        where: { userId: createdUserId },
      });
      for (const entry of entries) {
        await sleepRepo.delete(entry.id);
      }
    });

    it('should return stats with null averages if no entries in the last 7 days', async () => {
      const today = new Date();
      const { startDateString, endDateString } = getWeekDates(today);

      const response = await agent
        .get('/sleep/stats/weekly')
        .expect(HttpStatus.OK);

      expect(response.body.totalEntriesConsidered).toBe(0);
      expect(response.body.averageSleepDurationMinutes).toBeNull();
      expect(response.body.averageSleepTime).toBeNull();
      expect(response.body.averageWakeUpTime).toBeNull();
      expect(response.body.startDate).toBe(startDateString);
      expect(response.body.endDate).toBe(endDateString);
    });

    it('should calculate weekly stats correctly for multiple entries', async () => {
      const today = new Date();

      const date1 = new Date(today);
      date1.setDate(today.getDate() - 2);
      const date1Str = date1.toISOString().split('T')[0];
      const sleepTime1 = new Date(date1);
      sleepTime1.setUTCHours(22, 0, 0, 0);
      const wakeTime1 = new Date(date1);
      wakeTime1.setDate(date1.getDate() + 1);
      wakeTime1.setUTCHours(6, 0, 0, 0);
      await createSampleSleepEntry(
        date1Str,
        sleepTime1.toISOString(),
        wakeTime1.toISOString(),
      );

      const date2 = new Date(today);
      date2.setDate(today.getDate() - 4);
      const date2Str = date2.toISOString().split('T')[0];
      const sleepTime2 = new Date(date2);
      sleepTime2.setUTCHours(23, 30, 0, 0);
      const wakeTime2 = new Date(date2);
      wakeTime2.setDate(date2.getDate() + 1);
      wakeTime2.setUTCHours(7, 0, 0, 0);
      await createSampleSleepEntry(
        date2Str,
        sleepTime2.toISOString(),
        wakeTime2.toISOString(),
      );

      const date3 = new Date(today);
      date3.setDate(today.getDate() - 8);
      const date3Str = date3.toISOString().split('T')[0];
      const sleepTime3 = new Date(date3);
      sleepTime3.setUTCHours(21, 0, 0, 0);
      const wakeTime3 = new Date(date3);
      wakeTime3.setDate(date3.getDate() + 1);
      wakeTime3.setUTCHours(5, 0, 0, 0);
      await createSampleSleepEntry(
        date3Str,
        sleepTime3.toISOString(),
        wakeTime3.toISOString(),
      );

      const response = await agent
        .get('/sleep/stats/weekly')
        .expect(HttpStatus.OK);

      const { startDateString, endDateString } = getWeekDates(today);
      expect(response.body.startDate).toBe(startDateString);
      expect(response.body.endDate).toBe(endDateString);
      expect(response.body.totalEntriesConsidered).toBe(2);

      expect(response.body.averageSleepDurationMinutes).toBe(465);

      expect(response.body.averageSleepTime).toBe('22:45');
      expect(response.body.averageWakeUpTime).toBe('06:30');
    });

    it('should fail if not authenticated', async () => {
      const unauthenticatedAgent = request.agent(server);
      await unauthenticatedAgent
        .get('/sleep/stats/weekly')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
