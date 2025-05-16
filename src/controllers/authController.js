const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

const unregister = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await authService.unregister(userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting account',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  unregister
}; 