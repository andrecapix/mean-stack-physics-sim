import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccelerationCurveService } from './acceleration-curve.service';
import { CreateAccelerationCurveDto, CalculateAccelerationCurveDto, AccelerationCurveResponseDto } from './acceleration-curve.dto';

@Controller('acceleration-curve')
@UseGuards(JwtAuthGuard)
export class AccelerationCurveController {
  constructor(private readonly accelerationCurveService: AccelerationCurveService) {}

  @Post('calculate')
  calculate(@Body() calculateDto: CalculateAccelerationCurveDto) {
    return {
      points: this.accelerationCurveService.calculate(calculateDto),
    };
  }

  @Post('save')
  async create(
    @Request() req: any,
    @Body() createDto: CreateAccelerationCurveDto
  ): Promise<AccelerationCurveResponseDto> {
    return this.accelerationCurveService.create(req.user.userId, createDto);
  }

  @Get('list')
  async findAll(@Request() req: any): Promise<AccelerationCurveResponseDto[]> {
    return this.accelerationCurveService.findAll(req.user.userId);
  }

  @Get('default')
  async findDefault(@Request() req: any): Promise<AccelerationCurveResponseDto | null> {
    return this.accelerationCurveService.findDefault(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string): Promise<AccelerationCurveResponseDto> {
    return this.accelerationCurveService.findOne(req.user.userId, id);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: CreateAccelerationCurveDto
  ): Promise<AccelerationCurveResponseDto> {
    return this.accelerationCurveService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string): Promise<{ success: boolean }> {
    await this.accelerationCurveService.delete(req.user.userId, id);
    return { success: true };
  }
}