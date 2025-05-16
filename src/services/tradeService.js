const { Op } = require('sequelize');
const { Portfolio, Share, Trade, PortfolioShare, sequelize } = require('../models');
const { validateTradeRequest, validatePortfolioCreation, validateSharePriceUpdate } = require('../utils/validators');

const buyShares = async (buyData, userId) => {
  const { errors, isValid } = validateTradeRequest(buyData);
  
  if (!isValid) {
    return { success: false, errors };
  }

  let transaction;
  
  try {
    // Start database transaction
    transaction = await sequelize.transaction();
    
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      where: {
        userId: userId
      },
      transaction
    });
    
    if (!portfolio) {
      await transaction.rollback();
      return { 
        success: false, 
        message: 'Portfolio not found or not owned by the user'
      };
    }

    const share = await Share.findOne({
      where: { 
        symbol: buyData.symbol 
      },
      transaction
    });

    
    if (!share) {
      await transaction.rollback();
      return { 
        success: false, 
        message: 'Share not found'
      };
    }
    
    // Calculate total cost
    const quantity = parseInt(buyData.quantity);
    const price = parseFloat(share.currentPrice);
    const totalCost = price * quantity;
    
    // Check if portfolio has enough balance
    if (portfolio.balance < totalCost) {
      await transaction.rollback();
      return { 
        success: false, 
        message: 'Insufficient funds in portfolio'
      };
    }
    
    // Deduct from portfolio balance
    await portfolio.update(
      { balance: parseFloat(portfolio.balance) - totalCost },
      { transaction }
    );
    
    // Update or create portfolio share entry
    let portfolioShare = await PortfolioShare.findOne({
      where: {
        portfolioId: portfolio.id,
        shareId: share.id
      },
      transaction
    });
    
    if (portfolioShare) {
      // Update existing record
      await portfolioShare.update({
        quantity: portfolioShare.quantity + quantity
      }, { transaction });
    } else {
      // Create new record
      portfolioShare = await PortfolioShare.create({
        portfolioId: portfolio.id,
        shareId: share.id,
        quantity: quantity
      }, { transaction });
    }
    
    // Create trade record
    const trade = await Trade.create({
      type: 'BUY',
      portfolioId: portfolio.id,
      shareId: share.id,
      quantity,
      price,
      total: totalCost,
      status: 'COMPLETED'
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return {
      success: true,
      message: 'Shares purchased successfully',
      trade: {
        id: trade.id,
        type: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.total,
        share: {
          id: share.id,
          symbol: share.symbol,
          name: share.name,
          currentPrice: share.currentPrice
        }
      },
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        balance: portfolio.balance
      }
    };
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    
    return {
      success: false,
      message: 'Error during share purchase',
      error: error.message
    };
  }
};

const sellShares = async (sellData, userId) => {
  const { errors, isValid } = validateTradeRequest(sellData);
  
  if (!isValid) {
    return { success: false, errors };
  }

  let transaction;
  
  try {
    // Start database transaction
    transaction = await sequelize.transaction();
    
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      where: { 
        userId: userId
      },
      transaction
    });
    
    if (!portfolio) {
      await transaction.rollback();
      return { 
        success: false, 
        message: 'Portfolio not found or not owned by the user'
      };
    }
    
    // Find the share
    const share = await Share.findOne({
      where: { 
        symbol: sellData.symbol 
      },
      transaction
    });
    
    if (!share) {
      await transaction.rollback();
      return { 
        success: false, 
        message: 'Share not found'
      };
    }

    // Find the portfolio share record
    const portfolioShare = await PortfolioShare.findOne({
      where: {
        portfolioId: portfolio.id,
        shareId: share.id
      },
      transaction
    });
    
    if (!portfolioShare || portfolioShare.quantity < parseInt(sellData.quantity)) {
      await transaction.rollback();
      const availableShares = portfolioShare ? portfolioShare.quantity : 0;
      return { 
        success: false, 
        message: `Not enough shares available. You have ${availableShares} shares, but attempted to sell ${sellData.quantity}`
      };
    }

    const sellQuantity = parseInt(sellData.quantity);
    
    // Calculate total sale value
    const price = parseFloat(share.currentPrice);
    const totalValue = price * sellQuantity;
    
    // Update portfolio share quantity
    await portfolioShare.update({
      quantity: portfolioShare.quantity - sellQuantity
    }, { transaction });
    
    // Add to portfolio balance
    await portfolio.update(
      { balance: parseFloat(portfolio.balance) + totalValue },
      { transaction }
    );
    
    // Create trade record
    const trade = await Trade.create({
      type: 'SELL',
      portfolioId: portfolio.id,
      shareId: share.id,
      quantity: sellQuantity,
      price,
      total: totalValue,
      status: 'COMPLETED'
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return {
      success: true,
      message: 'Shares sold successfully',
      trade: {
        id: trade.id,
        type: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.total,
        share: {
          id: share.id,
          symbol: share.symbol,
          name: share.name,
          currentPrice: share.currentPrice
        }
      },
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        balance: portfolio.balance
      }
    };
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    
    return {
      success: false,
      message: 'Error during share sale',
      error: error.message
    };
  }
};

const getPortfolioShares = async (userId) => {
  try {
    // Find user's portfolio
    const portfolio = await Portfolio.findOne({
      where: { 
        userId
      }
    });
    
    if (!portfolio) {
      return { 
        success: false, 
        message: 'Portfolio not found for this user'
      };
    }
    
    // Get all portfolio shares with their details
    const portfolioShares = await PortfolioShare.findAll({
      where: { 
        portfolioId: portfolio.id,
        quantity: {
          [Op.gt]: 0
        }
      },
      include: [
        { 
          model: Share, 
          as: 'share'
        }
      ]
    });
    
    // Format the response
    const formattedShares = portfolioShares.map(item => ({
      shareId: item.shareId,
      symbol: item.share.symbol,
      name: item.share.name,
      quantity: item.quantity,
      currentPrice: parseFloat(item.share.currentPrice),
      totalValue: item.quantity * parseFloat(item.share.currentPrice)
    }));
    
    return {
      success: true,
      portfolioShares: formattedShares,
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        balance: portfolio.balance
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error retrieving portfolio shares',
      error: error.message
    };
  }
};

const createPortfolio = async (portfolioData, userId) => {
  const { errors, isValid } = validatePortfolioCreation(portfolioData);
  
  if (!isValid) {
    return { success: false, errors };
  }
  
  try {
    // Check if user already has a portfolio
    const existingPortfolio = await Portfolio.findOne({
      where: { userId }
    });
    
    if (existingPortfolio) {
      return {
        success: false,
        message: 'User already has a portfolio'
      };
    }
    
    // Create a new portfolio
    const portfolio = await Portfolio.create({
      userId,
      name: portfolioData.name || 'My Portfolio',
      balance: portfolioData.initialBalance || 10000.00
    });
    
    return {
      success: true,
      message: 'Portfolio created successfully',
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        balance: portfolio.balance
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error creating portfolio',
      error: error.message
    };
  }
};

const updateSharePrice = async (priceData) => {
  const { errors, isValid } = validateSharePriceUpdate(priceData);
  
  if (!isValid) {
    return { success: false, errors };
  }
  
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();
    
    const updatePromises = [];
    
    // Process each share price update
    for (const update of priceData.updates) {
      const { symbol, price } = update;
      
      // Find share by symbol
      const share = await Share.findOne({
        where: { symbol },
        transaction
      });
      
      if (share) {
        // Update the share price
        updatePromises.push(share.update({
          currentPrice: parseFloat(price),
          lastUpdated: new Date()
        }, { transaction }));
      }
    }
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Commit transaction
    await transaction.commit();
    
    return {
      success: true,
      message: `Successfully updated ${updatePromises.length} share prices`
    };
  } catch (error) {
    // Rollback on error
    if (transaction) await transaction.rollback();
    
    return {
      success: false,
      message: 'Error updating share prices',
      error: error.message
    };
  }
};

module.exports = {
  buyShares,
  sellShares,
  getPortfolioShares,
  createPortfolio,
  updateSharePrice
}; 