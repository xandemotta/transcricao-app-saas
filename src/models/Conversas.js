const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversa = sequelize.define('Conversa', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mensagemUsuario: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  mensagemAssistente: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Conversa;
