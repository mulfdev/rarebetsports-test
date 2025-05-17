import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { SleepService } from './sleep.service';
import {
  AuthenticatedUser,
  AuthenticatedUserType,
} from '../auth/decorators/user.decorator';

import { CreateSleepDto } from './dto/create-sleep.dto';
import { UpdateSleepDto } from './dto/update-sleep.dto';
import { SleepStatsDto } from './dto/sleep-stats.dto';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { SleepEntry } from './sleep.entity';

@Controller('sleep')
@UseGuards(AuthenticatedGuard)
export class SleepController {
  constructor(private readonly sleepService: SleepService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSleepEntry(
    @Body() createSleepDto: CreateSleepDto,
    @AuthenticatedUser() user: AuthenticatedUserType,
  ) {
    return this.sleepService.create(createSleepDto, user.userId);
  }

  @Get()
  async findAllSleepEntries(@AuthenticatedUser() user: AuthenticatedUserType) {
    return this.sleepService.findAllByUserId(user.userId);
  }

  @Get(':id')
  async findOneSleepEntry(
    @Param('id', ParseIntPipe) id: number,
    @AuthenticatedUser() user: AuthenticatedUserType,
  ) {
    return this.sleepService.findOne(id, user.userId);
  }

  @Patch(':id')
  async updateSleepEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSleepDto: UpdateSleepDto,
    @AuthenticatedUser() user: AuthenticatedUserType,
  ) {
    return this.sleepService.update(id, user.userId, updateSleepDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSleepEntry(
    @Param('id', ParseIntPipe) id: number,
    @AuthenticatedUser() user: AuthenticatedUserType,
  ) {
    await this.sleepService.remove(id, user.userId);
  }

  @Get('stats/weekly')
  async getWeeklyStats(@AuthenticatedUser() user: AuthenticatedUserType) {
    return this.sleepService.getWeeklyStats(user.userId);
  }
}
