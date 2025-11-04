const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PasswordResetToken extends Model {}
  PasswordResetToken.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { sequelize, tableName: 'password_reset_tokens' });

  PasswordResetToken.associate = (models) => {
    PasswordResetToken.belongsTo(models.User, { foreignKey: 'userId' });
  };
  return PasswordResetToken;
};
