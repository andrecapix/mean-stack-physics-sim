import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  } as any;

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
    authService = module.get(AuthService) as any;
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
      (authService as any).login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(loginResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException when login fails', async () => {
      (authService as any).login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

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

    const mockCreatedUser = {
      _id: 'user456',
      email: 'new@example.com',
      name: 'New User',
      role: 'user',
    };

    const expectedResponse = {
      message: 'User registered successfully',
      user: {
        id: 'user456',
        email: 'new@example.com',
        name: 'New User',
        role: 'user',
      },
    };

    it('should return user data when registration is successful', async () => {
      mockUsersService.create.mockResolvedValue(mockCreatedUser as any);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration errors', async () => {
      const error = new Error('User already exists');
      mockUsersService.create.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(error);
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('logout', () => {
    const mockRequest = {
      user: { userId: 'user123', email: 'test@example.com', role: 'user' },
    };

    it('should call authService.logout with user id', async () => {
      (authService as any).logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith('user123');
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed');
      (authService as any).logout.mockRejectedValue(error);

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
      (authService as any).refreshToken.mockResolvedValue(refreshResponse);

      const result = await controller.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result).toEqual(refreshResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should throw UnauthorizedException when no refresh token is provided', async () => {
      const requestWithoutToken = { cookies: {} };

      await expect(controller.refresh({ refreshToken: '' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('should handle refresh token errors', async () => {
      (authService as any).refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.refresh({ refreshToken: 'valid-refresh-token' })).rejects.toThrow(UnauthorizedException);
      expect(authService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });
  });

});