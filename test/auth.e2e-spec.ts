import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/users.entity';
import * as session from 'express-session';
import * as passport from 'passport';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;
  let configService: ConfigService;

  const testUser = {
    username: `e2e_user_${Date.now()}`,
    password: 'SecurePassword123!',
  };
  let createdUserId: number | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);

    const sessionSecret = configService.get<string>('SESSION_SECRET');
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET must be defined for E2E tests');
    }

    app.use(
      session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    dataSource = moduleFixture.get<DataSource>('DATA_SOURCE');
    server = app.getHttpServer();
    await app.init();
  });

  afterAll(async () => {
    if (createdUserId) {
      const userRepository = dataSource.getRepository(User);
      try {
        await userRepository.delete({ userId: createdUserId });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
    await app.close();
  });

  it('/auth/signup (POST) - should create a new user', async () => {
    const response = await request(server)
      .post('/auth/signup')
      .send({
        username: testUser.username,
        password: testUser.password,
      })
      .expect(201);

    expect(response.body).toEqual({ message: 'Signed up successfully!' });

    const userRepository = dataSource.getRepository(User);
    const dbUser = await userRepository.findOne({
      where: { username: testUser.username },
    });
    expect(dbUser).toBeDefined();
    if (dbUser) {
      expect(dbUser.username).toEqual(testUser.username);
      createdUserId = dbUser.userId;
    }
  });

  describe('with authenticated user', () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(async () => {
      agent = request.agent(server);

      const loginResponse = await agent
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201);

      expect(loginResponse.body.message).toEqual('Logged in successfully');
      expect(loginResponse.body.user.username).toEqual(testUser.username);
    });

    it('/auth/profile (GET) - should return user profile', async () => {
      const response = await agent.get('/auth/profile').expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.username).toEqual(testUser.username);
      expect(response.body.password).toBeUndefined();
    });

    it('/auth/logout (POST) - should log the user out', async () => {
      await agent.post('/auth/logout').expect(200);

      await agent.get('/auth/profile').expect(401);
    });
  });

  it('/auth/profile (GET) - should fail if not authenticated', async () => {
    return request(server).get('/auth/profile').expect(401);
  });

  it('/auth/login (POST) - should fail with invalid credentials', async () => {
    return request(server)
      .post('/auth/login')
      .send({
        username: testUser.username,
        password: 'WrongPassword!',
      })
      .expect(401);
  });

  it('/auth/login (POST) - should fail with non-existent user', async () => {
    return request(server)
      .post('/auth/login')
      .send({
        username: 'nonexistentuser12345',
        password: 'anypassword',
      })
      .expect(401);
  });

  it('/auth/signup (POST) - should fail with short username', async () => {
    return request(server)
      .post('/auth/signup')
      .send({
        username: 'u',
        password: 'ValidPassword123!',
      })
      .expect(HttpStatus.BAD_REQUEST)
      .then((response) => {
        expect(response.body.message).toContain(
          'Username must be at least 3 characters long.',
        );
      });
  });

  it('/auth/signup (POST) - should fail with short password', async () => {
    return request(server)
      .post('/auth/signup')
      .send({
        username: 'valid_username',
        password: 'short',
      })
      .expect(HttpStatus.BAD_REQUEST)
      .then((response) => {
        expect(response.body.message).toContain(
          'Password must be at least 12 characters long.',
        );
      });
  });

  it('/auth/signup (POST) - should fail with missing username', async () => {
    return request(server)
      .post('/auth/signup')
      .send({
        password: 'ValidPassword123!',
      })
      .expect(HttpStatus.BAD_REQUEST)
      .then((response) => {
        expect(response.body.message).toContain(
          'Username should not be empty.',
        );
      });
  });

  it('/auth/signup (POST) - should fail with missing password', async () => {
    return request(server)
      .post('/auth/signup')
      .send({
        username: 'valid_username',
      })
      .expect(HttpStatus.BAD_REQUEST)
      .then((response) => {
        expect(response.body.message).toContain(
          'Password should not be empty.',
        );
      });
  });
});
