module.exports = (sequelize, DataTypes) => {
  const Share = sequelize.define('Share', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    symbol: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[A-Z]{3}$/
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    currentPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
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
    tableName: 'shares',
    timestamps: true
  });

  Share.associate = (models) => {
    Share.hasMany(models.Trade, {
      foreignKey: 'shareId',
      as: 'trades'
    });
    Share.hasMany(models.PortfolioShare, {
      foreignKey: 'shareId',
      as: 'portfolioShares'
    });
  };

  return Share;
}; 