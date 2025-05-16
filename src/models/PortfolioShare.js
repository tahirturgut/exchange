module.exports = (sequelize, DataTypes) => {
  const PortfolioShare = sequelize.define('PortfolioShare', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      defaultValue: 0,
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
    tableName: 'portfolio_shares',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['portfolioId', 'shareId']
      }
    ]
  });

  PortfolioShare.associate = (models) => {
    PortfolioShare.belongsTo(models.Portfolio, {
      foreignKey: 'portfolioId',
      as: 'portfolio'
    });
    PortfolioShare.belongsTo(models.Share, {
      foreignKey: 'shareId',
      as: 'share'
    });
  };

  return PortfolioShare;
}; 