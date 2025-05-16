const { Op } = require('sequelize');
const { Portfolio, Share, Trade, PortfolioShare, sequelize } = require('../models');
const { validateTradeRequest, validatePortfolioCreation, validatePortfolioUpdate, validateSharePriceUpdate } = require('../utils/validators');
const isAdmin = require('../middleware/isAdmin');

const PORTFOLIO_NOT_FOUND = 'Portfolio not found';
const SHARE_NOT_FOUND = 'Share not found';
const PORTFOLIO_UPDATED_SUCCESSFULLY = 'Portfolio updated successfully';
const PORTFOLIO_CREATED_SUCCESSFULLY = 'Portfolio created successfully';
const PORTFOLIO_CREATION_ERROR = 'Error creating portfolio';
const PORTFOLIO_UPDATE_ERROR = 'Error updating portfolio';
const SHARE_PRICE_UPDATE_ERROR = 'Error updating share price';

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
        message: PORTFOLIO_NOT_FOUND
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
        message: SHARE_NOT_FOUND
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
    // Rollback on error, but only if the transaction hasn't been committed yet
    if (transaction && transaction.finished !== 'commit') {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
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
        message: PORTFOLIO_NOT_FOUND
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
        message: SHARE_NOT_FOUND
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
    // Rollback on error, but only if the transaction hasn't been committed yet
    if (transaction && transaction.finished !== 'commit') {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
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
        message: PORTFOLIO_NOT_FOUND
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
  
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Check if user already has a portfolio
    const existingPortfolio = await Portfolio.findOne({
      where: { userId },
      transaction
    });
    
    if (existingPortfolio) {
      await transaction.rollback();
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
    }, { transaction });
    
    // Process initial shares if provided
    const initialSharesResult = { processed: 0, errors: [] };
    
    if (portfolioData.initialShares && Array.isArray(portfolioData.initialShares) && portfolioData.initialShares.length > 0) {
      for (const shareData of portfolioData.initialShares) {
        // Find the share
        const share = await Share.findOne({
          where: { symbol: shareData.symbol },
          transaction
        });
        
        if (!share) {
          initialSharesResult.errors.push({
            symbol: shareData.symbol,
            error: SHARE_NOT_FOUND
          });
          continue;
        }
        
        // Create portfolio share entry
        await PortfolioShare.create({
          portfolioId: portfolio.id,
          shareId: share.id,
          quantity: parseInt(shareData.quantity)
        }, { transaction });
        
        initialSharesResult.processed++;
      }
    }
    
    // Commit transaction
    await transaction.commit();
    
    const result = {
      success: true,
      message: 'Portfolio created successfully',
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        balance: portfolio.balance
      }
    };
    
    // Include initial shares info if any were processed
    if (initialSharesResult.processed > 0) {
      result.initialShares = {
        processed: initialSharesResult.processed,
        errors: initialSharesResult.errors.length > 0 ? initialSharesResult.errors : undefined
      };
    }
    
    return result;
  } catch (error) {
    // Rollback on error, but only if the transaction hasn't been committed yet
    if (transaction && transaction.finished !== 'commit') {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    return {
      success: false,
      message: 'Error creating portfolio',
      error: error.message
    };
  }
};

const updatePortfolio = async (updateData, userId) => {
  const { errors, isValid } = validatePortfolioUpdate(updateData);
  
  if (!isValid) {
    return { success: false, errors };
  }
  
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Find user's portfolio
    const portfolio = await Portfolio.findOne({
      where: { userId },
      transaction
    });
    
    if (!portfolio) {
      await transaction.rollback();
      return {
        success: false,
        message: PORTFOLIO_NOT_FOUND
      };
    }
    
    // Update fields if provided
    const updates = {};
    
    if (updateData.name) {
      updates.name = updateData.name;
    }
    
    if (updateData.newBalance !== undefined) {
      if (updateData.newBalance < 0) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Balance cannot be negative'
        };
      }
      
      updates.balance = updateData.newBalance;
    }
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await portfolio.update(updates, { transaction });
    }
    
    // Commit transaction
    await transaction.commit();
    
    return {
      success: true,
      message: 'Portfolio updated successfully',
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        balance: portfolio.balance
      }
    };
  } catch (error) {
    // Rollback on error, but only if the transaction hasn't been committed yet
    if (transaction && transaction.finished !== 'commit') {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    return {
      success: false,
      message: 'Error updating portfolio',
      error: error.message
    };
  }
};

const updateSharePrice = async (priceData, user) => {
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
    // Rollback on error, but only if the transaction hasn't been committed yet
    if (transaction && transaction.finished !== 'commit') {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    return {
      success: false,
      message: SHARE_PRICE_UPDATE_ERROR,
      error: error.message
    };
  }
};

const deletePortfolio = async (userId, existingTransaction = null) => {
  let transaction = existingTransaction;
  let shouldCommit = false;
  
  try {
    // Start transaction if one wasn't provided
    if (!transaction) {
      transaction = await sequelize.transaction();
      shouldCommit = true;
    }
    
    // Find the portfolio
    const portfolio = await Portfolio.findOne({
      where: { userId },
      transaction
    });
    
    if (!portfolio) {
      if (shouldCommit) await transaction.rollback();
      return {
        success: false,
        message: PORTFOLIO_NOT_FOUND
      };
    }
    
    // Delete portfolio shares
    await PortfolioShare.destroy({
      where: { portfolioId: portfolio.id },
      transaction
    });
    
    // Delete trades
    await Trade.destroy({
      where: { portfolioId: portfolio.id },
      transaction
    });
    
    // Delete portfolio
    await portfolio.destroy({ transaction });
    
    // Commit transaction if we started it
    if (shouldCommit) await transaction.commit();
    
    return {
      success: true,
      message: 'Portfolio deleted successfully'
    };
  } catch (error) {
    // Only rollback if we started the transaction and it hasn't been committed yet
    if (shouldCommit && transaction && transaction.finished !== 'commit') {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    return {
      success: false,
      message: 'Error deleting portfolio',
      error: error.message
    };
  }
};

module.exports = {
  buyShares,
  sellShares,
  getPortfolioShares,
  createPortfolio,
  updatePortfolio,
  updateSharePrice,
  deletePortfolio
}; 