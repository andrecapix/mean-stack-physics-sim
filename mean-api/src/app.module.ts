import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './modules/health/health.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AccelerationCurveModule } from './modules/acceleration-curve/acceleration-curve.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.production', '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [],
      useFactory: () => {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mean-stack-db';
        console.log('🔍 MONGODB_URI:', mongoUri.substring(0, 30) + '...');
        console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
        return {
          uri: mongoUri,
          retryWrites: true,
          w: 'majority',
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          bufferCommands: false,
          maxPoolSize: 10,
          minPoolSize: 5,
          maxIdleTimeMS: 30000,
        };
      },
    }),
    HealthModule,
    SimulationModule,
    AuthModule,
    UsersModule,
    AccelerationCurveModule,
  ],
})
export class AppModule {}