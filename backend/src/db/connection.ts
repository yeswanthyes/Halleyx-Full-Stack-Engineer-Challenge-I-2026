import { Sequelize } from 'sequelize';
import path from 'path';

const storagePath = path.resolve(__dirname, '../../database2.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false, // Set to true to see SQL queries in console
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to SQLite database.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};
