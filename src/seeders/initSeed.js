require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Portfolio, Share, Trade, PortfolioShare } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('Starting database synchronization...');
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');
    
    console.log('Seeding users...');
    const users = await User.bulkCreate([
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      },
      {
        username: 'admin_user',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      },
      {
        username: 'trader_joe',
        email: 'joe@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      },
      {
        username: 'investor_mary',
        email: 'mary@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      }
    ]);
    console.log(`${users.length} users created successfully.`);
    
    console.log('Seeding portfolios...');
    const portfolios = await Portfolio.bulkCreate([
      {
        userId: 1,
        name: 'John\'s Portfolio',
        balance: 10000.00
      },
      {
        userId: 2,
        name: 'Jane\'s Investments',
        balance: 15000.00
      },
      {
        userId: 3,
        name: 'Admin\'s Portfolio',
        balance: 20000.00
      },
      {
        userId: 4,
        name: 'Joe\'s Trades',
        balance: 5000.00
      },
      {
        userId: 5,
        name: 'Mary\'s Investments',
        balance: 25000.00
      }
    ]);
    console.log(`${portfolios.length} portfolios created successfully.`);
    
    console.log('Seeding shares...');
    const shares = await Share.bulkCreate([
      {
        symbol: 'ABC',
        name: 'ABC Corporation',
        currentPrice: 150.50
      },
      {
        symbol: 'XYZ',
        name: 'XYZ Technologies',
        currentPrice: 75.25
      },
      {
        symbol: 'EVA',
        name: 'EvaExchange Inc.',
        currentPrice: 200.00
      },
      {
        symbol: 'TRD',
        name: 'Traders Group',
        currentPrice: 45.75
      },
      {
        symbol: 'SUP',
        name: 'Super Traders LLC',
        currentPrice: 95.80
      }
    ]);
    console.log(`${shares.length} shares created successfully.`);
    
    console.log('Seeding initial trades...');
    const trades = await Trade.bulkCreate([
      {
        type: 'BUY',
        portfolioId: 1,
        shareId: 1,
        quantity: 10,
        price: 150.50,
        total: 1505.00,
        status: 'COMPLETED'
      },
      {
        type: 'BUY',
        portfolioId: 1,
        shareId: 3,
        quantity: 5,
        price: 200.00,
        total: 1000.00,
        status: 'COMPLETED'
      },
      {
        type: 'BUY',
        portfolioId: 2,
        shareId: 2,
        quantity: 15,
        price: 75.25,
        total: 1128.75,
        status: 'COMPLETED'
      },
      {
        type: 'BUY',
        portfolioId: 3,
        shareId: 5,
        quantity: 20,
        price: 95.80,
        total: 1916.00,
        status: 'COMPLETED'
      },
      {
        type: 'BUY',
        portfolioId: 4,
        shareId: 4,
        quantity: 30,
        price: 45.75,
        total: 1372.50,
        status: 'COMPLETED'
      },
      {
        type: 'SELL',
        portfolioId: 1,
        shareId: 1,
        quantity: 2,
        price: 155.00,
        total: 310.00,
        status: 'COMPLETED'
      },
      {
        type: 'SELL',
        portfolioId: 2,
        shareId: 2,
        quantity: 5,
        price: 80.00,
        total: 400.00,
        status: 'COMPLETED'
      }
    ]);
    console.log(`${trades.length} initial trades created successfully.`);
    
    // Calculate portfolio shares based on trades
    console.log('Initializing portfolio shares...');
    const portfolioShares = {};
    
    // Process all trades to calculate current holdings
    for (const trade of trades) {
      const key = `${trade.portfolioId}-${trade.shareId}`;
      
      if (!portfolioShares[key]) {
        portfolioShares[key] = {
          portfolioId: trade.portfolioId,
          shareId: trade.shareId,
          quantity: 0
        };
      }
      
      if (trade.type === 'BUY') {
        portfolioShares[key].quantity += trade.quantity;
      } else if (trade.type === 'SELL') {
        portfolioShares[key].quantity -= trade.quantity;
      }
    }
    
    // Create portfolio share records
    const portfolioShareRecords = [];
    for (const key in portfolioShares) {
      if (portfolioShares[key].quantity > 0) {
        portfolioShareRecords.push(portfolioShares[key]);
      }
    }
    
    const createdPortfolioShares = await PortfolioShare.bulkCreate(portfolioShareRecords);
    console.log(`${createdPortfolioShares.length} portfolio share records created successfully.`);
    
    // Add indexes for better performance
    try {
      console.log('Creating database indexes...');
      
      // Add index for faster portfolio lookups by user ID
      await sequelize.query(
        'CREATE INDEX IF NOT EXISTS "portfolios_userId_idx" ON "portfolios" ("userId")'
      );
      
      // Add index for faster share lookups by symbol
      await sequelize.query(
        'CREATE INDEX IF NOT EXISTS "shares_symbol_idx" ON "shares" ("symbol")'
      );
      
      // Add index for faster portfolio share lookups by quantity > 0
      await sequelize.query(
        'CREATE INDEX IF NOT EXISTS "portfolio_shares_with_quantity_idx" ON "portfolio_shares" ("portfolioId", "quantity") WHERE "quantity" > 0'
      );
      
      console.log('Database indexes created successfully.');
    } catch (indexError) {
      console.warn('Warning: Could not create all indexes:', indexError.message);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
};

seedDatabase(); 