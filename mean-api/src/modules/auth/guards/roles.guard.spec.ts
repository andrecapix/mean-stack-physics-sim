import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockExecutionContext({ role: 'user' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockExecutionContext({ role: 'admin' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when user has one of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'moderator']);
    const context = createMockExecutionContext({ role: 'moderator' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockExecutionContext({ role: 'user' });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user role is undefined', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockExecutionContext({ role: undefined });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user is undefined', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockExecutionContext(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should handle empty roles array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockExecutionContext({ role: 'user' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should be case sensitive for role comparison', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    const context = createMockExecutionContext({ role: 'admin' });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});