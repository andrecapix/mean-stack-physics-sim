import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@/modules/users/users.service';
import { PrefetchService } from '@/common/services/prefetch.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserDocument } from '@/database/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prefetchService: PrefetchService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Gerar refresh token (implementação simplificada para MVP)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_EXPIRATION', '7d'),
    });

    // Salvar refresh token no usuário
    await this.usersService.updateRefreshToken(user._id, refreshToken);

    console.log('User logged in successfully', { userId: user._id, email: user.email });

    // Trigger smart prefetching for user dashboard data
    this.prefetchService.triggerSmartPrefetch(user._id.toString(), 'login');

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ accessToken: string; user: any }> {
    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user
    const user: UserDocument = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || 'user',
    });

    // Generate tokens
    const userId = (user as any)._id.toString();
    const payload = {
      email: user.email,
      sub: userId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_EXPIRATION', '7d'),
    });

    // Save refresh token
    await this.usersService.updateRefreshToken(userId, refreshToken);

    console.log('User registered successfully', { userId, email: user.email });

    return {
      accessToken,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    if (await bcrypt.compare(password, user.password)) {
      const { password: userPassword, refreshToken, ...result } = user.toObject();
      return result;
    }

    return null;
  }

  async logout(userId: string): Promise<{ success: boolean }> {
    await this.usersService.updateRefreshToken(userId, null);
    console.log('User logged out', { userId });

    return { success: true };
  }

  async refreshToken(oldRefreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.configService.get<string>('REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        email: user.email,
        sub: user._id,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}