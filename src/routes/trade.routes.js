const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const authenticate = require('../middleware/authenticate');

// All trade routes require authentication
router.use(authenticate);

/**
 * @route   POST /trade/portfolio
 * @desc    Create a portfolio for the user
 * @access  Private
 */
router.post('/portfolio', tradeController.createPortfolio);

/**
 * @route   POST /trade/buy
 * @desc    Buy shares
 * @access  Private
 */
router.post('/buy', tradeController.buyShares);

/**
 * @route   POST /trade/sell
 * @desc    Sell shares
 * @access  Private
 */
router.post('/sell', tradeController.sellShares);

/**
 * @route   GET /trade/portfolio
 * @desc    Get portfolio shares for the logged-in user
 * @access  Private
 */
router.get('/portfolio', tradeController.getPortfolioShares);

/**
 * @route   POST /trade/update-prices
 * @desc    Update share prices
 * @access  Private
 */
router.post('/update-prices', tradeController.updateSharePrice);

module.exports = router; 