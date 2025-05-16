const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Portfolio } = require('../src/models');
const authService = require('../src/services/authService');
const jwtConfig = require('../src/config/jwt');

// Mock dependencies
jest.mock('../src/models', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    comparePassword: jest.fn()
  };
  
  return {
    User: {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue(mockUser)
    },
    Portfolio: {
      create: jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Default Portfolio',
        balance: 10000.00
      })
    }
  };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token')
}));

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    it('should register a new user successfully', async () => {
      // Mock finding no existing users
      User.findOne.mockResolvedValue(null);
      
      const result = await authService.register(validUserData);
      
      expect(User.findOne).toHaveBeenCalledTimes(2); // Check both username and email
      expect(User.create).toHaveBeenCalledWith({
        username: validUserData.username,
        email: validUserData.email,
        password: validUserData.password,
        role: 'user'
      });
      expect(jwt.sign).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
    });
    
    it('should return error when username already exists', async () => {
      // Mock finding existing user by username
      User.findOne.mockResolvedValueOnce({
        username: 'testuser'
      });
      
      const result = await authService.register(validUserData);
      
      expect(User.findOne).toHaveBeenCalledTimes(1); // Only check username
      expect(User.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errors.username).toBe('Username already taken');
    });
    
    it('should return error when email already exists', async () => {
      // Mock username check returns null, email check returns existing user
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        email: 'test@example.com'
      });
      
      const result = await authService.register(validUserData);
      
      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(User.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errors.email).toBe('Email already registered');
    });
    
    it('should validate input and return errors for invalid data', async () => {
      const invalidUserData = {
        username: 'te', // Too short
        email: 'not-an-email',
        password: '123' // Too short
      };
      
      const result = await authService.register(invalidUserData);
      
      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errors.username).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });
  });
  
  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    it('should login successfully with valid credentials', async () => {
      // Mock finding user and successful password comparison
      User.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true)
      });
      
      const result = await authService.login(validLoginData);
      
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-token');
    });
    
    it('should return error with invalid credentials (user not found)', async () => {
      // Mock user not found
      User.findOne.mockResolvedValue(null);
      
      const result = await authService.login(validLoginData);
      
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errors.login).toBe('Invalid credentials');
    });
    
    it('should return error with invalid credentials (wrong password)', async () => {
      // Mock finding user but failed password comparison
      User.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(false)
      });
      
      const result = await authService.login(validLoginData);
      
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errors.password).toBe('Invalid credentials');
    });
    
    it('should validate input and return errors for missing data', async () => {
      const invalidLoginData = {
        // Missing email or username
        password: ''
      };
      
      const result = await authService.login(invalidLoginData);
      
      expect(User.findOne).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errors.login).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });
  });
}); 