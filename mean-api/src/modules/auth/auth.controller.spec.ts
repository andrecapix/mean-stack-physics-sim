import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller;
  let authService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateRefreshToken: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const loginResponse = {
      accessToken: 'jwt-token',
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
    };

    it('should return access token and user data when login is successful', async () => {
      authService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(loginResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException when login fails', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: 'user' as const,
    };

    const registerResponse = {
      accessToken: 'jwt-token',
      user: {
        id: 'user456',
        email: 'new@example.com',
        name: 'New User',
        role: 'user',
      },
    };

    it('should return access token and user data when registration is successful', async () => {
      authService.register.mockResolvedValue(registerResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(registerResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration errors', async () => {
      const error = new Error('User already exists');
      authService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(error);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('logout', () => {
    const mockRequest = {
      user: { userId: 'user123', email: 'test@example.com', role: 'user' },
    };

    it('should call authService.logout with user id', async () => {
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith('user123');
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed');
      authService.logout.mockRejectedValue(error);

      await expect(controller.logout(mockRequest)).rejects.toThrow(error);
      expect(authService.logout).toHaveBeenCalledWith('user123');
    });
  });

  describe('refreshToken', () => {
    const mockRequest = {
      cookies: { refreshToken: 'valid-refresh-token' },
    };

    const refreshResponse = {
      accessToken: 'new-jwt-token',
    };

    it('should return new access token when refresh token is valid', async () => {
      authService.refreshToken.mockResolvedValue(refreshResponse);

      const result = await controller.refreshToken(mockRequest);

      expect(result).toEqual(refreshResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should throw UnauthorizedException when no refresh token is provided', async () => {
      const requestWithoutToken = { cookies: {} };

      await expect(controller.refreshToken(requestWithoutToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('should handle refresh token errors', async () => {
      authService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.refreshToken(mockRequest)).rejects.toThrow(UnauthorizedException);
      expect(authService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });
  });

  describe('getProfile', () => {
    const mockRequest = {
      user: {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user',
      },
    };

    it('should return user profile data', () => {
      const result = controller.getProfile(mockRequest);

      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      });
    });
  });
});