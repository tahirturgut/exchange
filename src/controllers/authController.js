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

module.exports = {
  register,
  login
}; 