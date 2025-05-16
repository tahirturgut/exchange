const { Portfolio, Share, Trade, sequelize } = require('../src/models');
const tradeService = require('../src/services/tradeService');

// Mock dependencies
jest.mock('../src/models', () => {
  const mockSequelize = {
    transaction: jest.fn().mockImplementation(() => ({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    }))
  };
  
  return {
    Portfolio: {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue([1])
    },
    Share: {
      findOne: jest.fn(),
      findByPk: jest.fn()
    },
    Trade: {
      create: jest.fn(),
      sum: jest.fn(),
      findAll: jest.fn()
    },
    PortfolioShare: {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn()
    },
    sequelize: mockSequelize
  };
});

describe('Trade Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('buyShares', () => {
    const userId = 1;
    const validBuyData = {
      symbol: 'ABC',
      quantity: 5
    };
    
    it('should buy shares successfully', async () => {
      // Mock portfolio with sufficient balance
      Portfolio.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Test Portfolio',
        balance: 10000.00,
        update: jest.fn().mockResolvedValue()
      });
      
      // Mock share
      Share.findOne.mockResolvedValue({
        id: 1,
        symbol: 'ABC',
        name: 'ABC Corp',
        currentPrice: 100.00
      });
      
      // Mock trade creation
      Trade.create.mockResolvedValue({
        id: 1,
        type: 'BUY',
        portfolioId: 1,
        shareId: 1,
        quantity: 5,
        price: 100.00,
        total: 500.00,
        status: 'COMPLETED'
      });
      
      const result = await tradeService.buyShares(validBuyData, userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(Share.findOne).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.trade).toBeDefined();
      expect(result.portfolio).toBeDefined();
    });
    
    it('should return error if portfolio not found', async () => {
      // Mock portfolio not found
      Portfolio.findOne.mockResolvedValue(null);
      
      const result = await tradeService.buyShares(validBuyData, userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(Share.findOne).not.toHaveBeenCalled();
      expect(Trade.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Portfolio not found');
    });
    
    it('should return error if share not found', async () => {
      // Mock portfolio found but share not found
      Portfolio.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Test Portfolio',
        balance: 10000.00
      });
      
      Share.findOne.mockResolvedValue(null);
      
      const result = await tradeService.buyShares(validBuyData, userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(Share.findOne).toHaveBeenCalled();
      expect(Trade.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Share not found');
    });
    
    it('should return error if insufficient funds', async () => {
      // Mock portfolio with insufficient balance
      Portfolio.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Test Portfolio',
        balance: 100.00
      });
      
      // Mock share with high price
      Share.findOne.mockResolvedValue({
        id: 1,
        symbol: 'ABC',
        name: 'ABC Corp',
        currentPrice: 500.00 // 5 shares * 500 = 2500 > 100 balance
      });
      
      const result = await tradeService.buyShares(validBuyData, userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(Share.findOne).toHaveBeenCalled();
      expect(Trade.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient funds');
    });
  });
  
  describe('sellShares', () => {
    const userId = 1;
    const validSellData = {
      symbol: 'ABC',
      quantity: 3
    };
    
    it('should sell shares successfully', async () => {
      // Mock portfolio
      Portfolio.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Test Portfolio',
        balance: 10000.00,
        update: jest.fn().mockResolvedValue()
      });
      
      // Mock share
      Share.findOne.mockResolvedValue({
        id: 1,
        symbol: 'ABC',
        name: 'ABC Corp',
        currentPrice: 100.00
      });
      
      // Mock portfolio share
      const mockPortfolioShare = {
        portfolioId: 1,
        shareId: 1,
        quantity: 10,
        update: jest.fn().mockResolvedValue()
      };
      
      require('../src/models').PortfolioShare.findOne.mockResolvedValue(mockPortfolioShare);
      
      // Mock trade creation
      Trade.create.mockResolvedValue({
        id: 2,
        type: 'SELL',
        portfolioId: 1,
        shareId: 1,
        quantity: 3,
        price: 100.00,
        total: 300.00,
        status: 'COMPLETED'
      });
      
      const result = await tradeService.sellShares(validSellData, userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(Share.findOne).toHaveBeenCalled();
      expect(Trade.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.trade).toBeDefined();
      expect(result.portfolio).toBeDefined();
    });
    
    it('should return error if not enough shares to sell', async () => {
      // Mock portfolio
      Portfolio.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Test Portfolio',
        balance: 10000.00
      });
      
      // Mock share
      Share.findOne.mockResolvedValue({
        id: 1,
        symbol: 'ABC',
        name: 'ABC Corp',
        currentPrice: 100.00
      });
      
      // Mock insufficient shares in portfolio
      const mockPortfolioShare = {
        portfolioId: 1,
        shareId: 1,
        quantity: 2, // Only 2 shares, but trying to sell 3
        update: jest.fn().mockResolvedValue()
      };
      
      require('../src/models').PortfolioShare.findOne.mockResolvedValue(mockPortfolioShare);
      
      const result = await tradeService.sellShares(validSellData, userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(Share.findOne).toHaveBeenCalled();
      expect(Trade.create).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Not enough shares available');
    });
  });
  
  describe('getPortfolioShares', () => {
    const userId = 1;
    
    it('should return portfolio shares correctly', async () => {
      // Mock portfolio
      Portfolio.findOne.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'Test Portfolio',
        balance: 10000.00
      });
      
      // Mock portfolio shares
      require('../src/models').PortfolioShare.findAll.mockResolvedValue([
        {
          shareId: 1,
          quantity: 7,
          share: {
            id: 1,
            symbol: 'ABC',
            name: 'ABC Corp',
            currentPrice: 100.00
          }
        },
        {
          shareId: 2,
          quantity: 5,
          share: {
            id: 2,
            symbol: 'XYZ',
            name: 'XYZ Inc',
            currentPrice: 200.00
          }
        }
      ]);
      
      const result = await tradeService.getPortfolioShares(userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(require('../src/models').PortfolioShare.findAll).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.portfolioShares).toHaveLength(2);
      
      // Check proper shares in portfolio
      expect(result.portfolioShares.find(s => s.symbol === 'ABC').quantity).toBe(7);
      expect(result.portfolioShares.find(s => s.symbol === 'XYZ').quantity).toBe(5);
    });
    
    it('should return error if portfolio not found', async () => {
      // Mock portfolio not found
      Portfolio.findOne.mockResolvedValue(null);
      
      const result = await tradeService.getPortfolioShares(userId);
      
      expect(Portfolio.findOne).toHaveBeenCalled();
      expect(require('../src/models').PortfolioShare.findAll).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Portfolio not found');
    });
  });
}); 