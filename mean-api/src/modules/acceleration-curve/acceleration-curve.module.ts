import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccelerationCurveController } from './acceleration-curve.controller';
import { AccelerationCurveService } from './acceleration-curve.service';
import { AccelerationCurve, AccelerationCurveSchema } from './acceleration-curve.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccelerationCurve.name, schema: AccelerationCurveSchema },
    ]),
  ],
  controllers: [AccelerationCurveController],
  providers: [AccelerationCurveService],
  exports: [AccelerationCurveService],
})
export class AccelerationCurveModule {}