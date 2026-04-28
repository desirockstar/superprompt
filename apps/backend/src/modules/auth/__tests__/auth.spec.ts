import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      mockAuthService.register.mockResolvedValue({ id: '1', email: dto.email });

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual({ id: '1', email: dto.email });
    });

    it('should throw error for duplicate email', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      mockAuthService.register.mockRejectedValue(new Error('Email already registered'));

      await expect(controller.register(dto)).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      mockAuthService.login.mockResolvedValue({ id: '1', email: dto.email, isAdmin: false });

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toHaveProperty('token', '1');
    });

    it('should throw error for invalid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'wrongpassword' };
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('me', () => {
    it('should return user data', async () => {
      const req = { user: { id: '1' } };
      mockAuthService.getUser.mockResolvedValue({ id: '1', email: 'test@example.com', isAdmin: false });

      const result = await controller.me(req);

      expect(mockAuthService.getUser).toHaveBeenCalledWith('1');
      expect(result).toEqual({ id: '1', email: 'test@example.com', isAdmin: false });
    });
  });
});
