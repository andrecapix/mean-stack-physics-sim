import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service;
  let usersService;
  let jwtService;
  let configService;

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    role: 'user',
    refreshToken: null,
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateRefreshToken: jest.fn(),
      findById: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual({
        _id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
    });

    it('should return null when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.password);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return access token and user data when login is successful', async () => {
      const validatedUser = {
        _id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(validatedUser);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValueOnce('refresh-secret').mockReturnValueOnce('7d');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      });
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(mockUser._id, 'refresh-token');
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: 'user' as const,
    };

    it('should create new user and return access token', async () => {
      const hashedPassword = 'hashedPassword123';
      const createdUser = { ...mockUser, ...registerDto, password: hashedPassword };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersService.create.mockResolvedValue(createdUser);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValueOnce('refresh-secret').mockReturnValueOnce('7d');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        user: {
          id: createdUser._id,
          email: createdUser.email,
          name: createdUser.name,
          role: createdUser.role,
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: mockUser._id, email: mockUser.email, role: mockUser.role };

      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockReturnValue(payload);
      usersService.findById.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, { secret: 'refresh-secret' });
      expect(usersService.findById).toHaveBeenCalledWith(mockUser._id);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token for user', async () => {
      const userId = 'user123';
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout(userId);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });
  });
});