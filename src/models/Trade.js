module.exports = (sequelize, DataTypes) => {
  const Trade = sequelize.define('Trade', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('BUY', 'SELL'),
      allowNull: false
    },
    portfolioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'portfolios',
        key: 'id'
      }
    },
    shareId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shares',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('COMPLETED', 'FAILED', 'PENDING'),
      defaultValue: 'COMPLETED'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'trades',
    timestamps: true,
    hooks: {
      beforeValidate: (trade) => {
        trade.total = parseFloat(trade.price) * trade.quantity;
      }
    }
  });

  Trade.associate = (models) => {
    Trade.belongsTo(models.Portfolio, {
      foreignKey: 'portfolioId',
      as: 'portfolio'
    });
    Trade.belongsTo(models.Share, {
      foreignKey: 'shareId',
      as: 'share'
    });
  };

  return Trade;
}; 