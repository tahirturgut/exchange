const jwt = require('jsonwebtoken');
const { User, Portfolio } = require('../models');
const jwtConfig = require('../config/jwt');
const { validateRegistration, validateLogin } = require('../utils/validators');
const tradeService = require('./tradeService');

const register = async (userData) => {
  const { errors, isValid } = validateRegistration(userData);
  
  if (!isValid) {
    return { success: false, errors };
  }

  try {
    // Check if username already exists
    const existingUserByUsername = await User.findOne({ where: { username: userData.username } });
    if (existingUserByUsername) {
      return { 
        success: false, 
        errors: { username: 'Username already taken' } 
      };
    }

    // Check if email already exists
    const existingUserByEmail = await User.findOne({ where: { email: userData.email } });
    if (existingUserByEmail) {
      return { 
        success: false, 
        errors: { email: 'Email already registered' } 
      };
    }

    // Create user
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error during registration',
      error: error.message
    };
  }
};

const login = async (loginData) => {
  const { errors, isValid } = validateLogin(loginData);
  
  if (!isValid) {
    return { success: false, errors };
  }

  try {
    // Find user by email or username
    const user = loginData.email 
      ? await User.findOne({ where: { email: loginData.email } })
      : await User.findOne({ where: { username: loginData.username } });

    if (!user) {
      return { 
        success: false, 
        errors: { login: 'Invalid credentials' } 
      };
    }

    // Check password
    const isPasswordValid = await user.comparePassword(loginData.password);
    if (!isPasswordValid) {
      return { 
        success: false, 
        errors: { password: 'Invalid credentials' } 
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error during login',
      error: error.message
    };
  }
};

const unregister = async (userId) => {
  let transaction;
  
  try {
    // Start transaction
    transaction = await User.sequelize.transaction();
    
    // Find user
    const user = await User.findByPk(userId, { transaction });
    
    if (!user) {
      await transaction.rollback();
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Delete portfolio first
    const portfolioResult = await tradeService.deletePortfolio(userId, transaction);
    
    if (!portfolioResult.success) {
      await transaction.rollback();
      return portfolioResult;
    }
    
    // Delete user
    await user.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return {
      success: true,
      message: 'User account deleted successfully'
    };
  } catch (error) {
    // Rollback on error
    if (transaction) await transaction.rollback();
    
    return {
      success: false,
      message: 'Error deleting user account',
      error: error.message
    };
  }
};

module.exports = {
  register,
  login,
  unregister
}; 