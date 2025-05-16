module.exports = (sequelize, DataTypes) => {
  const Portfolio = sequelize.define('Portfolio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 10000.00, // Starting balance
      allowNull: false,
      validate: {
        min: 0
      }
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
    tableName: 'portfolios',
    timestamps: true
  });

  Portfolio.associate = (models) => {
    Portfolio.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Portfolio.hasMany(models.Trade, {
      foreignKey: 'portfolioId',
      as: 'trades'
    });
    Portfolio.hasMany(models.PortfolioShare, {
      foreignKey: 'portfolioId',
      as: 'portfolioShares'
    });
  };

  return Portfolio;
}; 