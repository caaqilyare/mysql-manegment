"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnection = exports.query = exports.createConnection = void 0;
const mysql2_1 = __importDefault(require("mysql2"));
let pool = null;
const createConnection = (config) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const poolConfig = {
            host: config.host,
            user: config.user,
            password: config.password,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
        if (config.database) {
            poolConfig.database = config.database;
        }
        pool = mysql2_1.default.createPool(poolConfig);
        // Test connection
        const connection = yield pool.promise().getConnection();
        console.log('Successfully connected to the database.');
        connection.release();
        return { success: true };
    }
    catch (error) {
        console.error('Error connecting to the database:', error);
        return { success: false, error };
    }
});
exports.createConnection = createConnection;
const query = (sql_1, ...args_1) => __awaiter(void 0, [sql_1, ...args_1], void 0, function* (sql, params = []) {
    if (!pool) {
        throw new Error('Database connection not initialized');
    }
    try {
        const [results] = yield pool.promise().execute(sql, params);
        return results;
    }
    catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
});
exports.query = query;
const closeConnection = () => {
    if (pool) {
        pool.end();
        pool = null;
    }
};
exports.closeConnection = closeConnection;
exports.default = pool;
