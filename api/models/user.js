const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {}

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'A first name is required' },
        notEmpty: { msg: 'Please provide a first name.' }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'A last name is required.' },
        notEmpty: { msg: 'Please provide a last name.' }
      }
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'The email address you entered already exists.' },
      validate: {
        notNull: { msg: 'An email address is required' },
        notEmpty: { msg: 'Please provide an email address.' },
        isEmail: { msg: 'Please enter a valid email address.' }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'A password is required' },
        notEmpty: { msg: 'Please provide a password.' },
        len: {
          args: [8, 100],
          msg: 'Your password should be between 8 and 100 characters.'
        }
      }
    },
    // Added fields for login attempt security
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    secretKey: {
      type: DataTypes.STRING,
      allowNull: true
    }
  
  }, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
      foreignKey: { fieldName: 'userId' }
    });
  };

  return User;
};
