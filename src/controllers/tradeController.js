const tradeService = require('../services/tradeService');

const buyShares = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await tradeService.buyShares(req.body, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during share purchase',
      error: error.message
    });
  }
};

const sellShares = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await tradeService.sellShares(req.body, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during share sale',
      error: error.message
    });
  }
};

const getPortfolioShares = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await tradeService.getPortfolioShares(userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving portfolio shares',
      error: error.message
    });
  }
};

const createPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await tradeService.createPortfolio(req.body, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating portfolio',
      error: error.message
    });
  }
};

const updateSharePrice = async (req, res) => {
  try {
    
    const result = await tradeService.updateSharePrice(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating share prices',
      error: error.message
    });
  }
};

module.exports = {
  buyShares,
  sellShares,
  getPortfolioShares,
  createPortfolio,
  updateSharePrice
}; 