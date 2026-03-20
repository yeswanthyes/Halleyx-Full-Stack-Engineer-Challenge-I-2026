"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const path_1 = __importDefault(require("path"));
const storagePath = path_1.default.resolve(__dirname, '../../database2.sqlite');
exports.sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false, // Set to true to see SQL queries in console
});
const connectDB = async () => {
    try {
        await exports.sequelize.authenticate();
        console.log('Successfully connected to SQLite database.');
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
