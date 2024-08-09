// models/Transcription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transcription = sequelize.define('Transcription', {
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Transcription;
