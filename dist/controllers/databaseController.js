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
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = exports.getTableStructure = exports.getTables = exports.deleteDatabase = exports.createDatabase = exports.getDatabases = exports.disconnect = exports.connect = void 0;
const db_1 = require("../config/db");
const connect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { host, user, password } = req.body;
    if (!host || !user || !password) {
        return res.status(400).json({ error: 'Missing required connection parameters' });
    }
    try {
        const result = yield (0, db_1.createConnection)({
            host,
            user,
            password
        });
        if (result.success) {
            res.json({ message: 'Connected successfully' });
        }
        else {
            res.status(400).json({ error: 'Connection failed', details: result.error });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Error connecting to database' });
    }
});
exports.connect = connect;
const disconnect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, db_1.closeConnection)();
        res.json({ message: 'Disconnected successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error disconnecting from database' });
    }
});
exports.disconnect = disconnect;
const getDatabases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const databases = yield (0, db_1.query)('SHOW DATABASES');
        res.json(databases);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching databases' });
    }
});
exports.getDatabases = getDatabases;
const createDatabase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Missing required database name' });
    }
    try {
        yield (0, db_1.query)('CREATE DATABASE ??', [name]);
        res.json({ message: `Database ${name} created successfully` });
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating database' });
    }
});
exports.createDatabase = createDatabase;
const deleteDatabase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.params;
    if (!name) {
        return res.status(400).json({ error: 'Missing required database name' });
    }
    try {
        yield (0, db_1.query)('DROP DATABASE ??', [name]);
        res.json({ message: `Database ${name} deleted successfully` });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting database' });
    }
});
exports.deleteDatabase = deleteDatabase;
const getTables = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { database } = req.params;
    if (!database) {
        return res.status(400).json({ error: 'Missing required database name' });
    }
    try {
        yield (0, db_1.query)('USE ??', [database]);
        const tables = yield (0, db_1.query)('SHOW TABLES');
        res.json(tables);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching tables' });
    }
});
exports.getTables = getTables;
const getTableStructure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { database, table } = req.params;
    if (!database || !table) {
        return res.status(400).json({ error: 'Missing required database or table name' });
    }
    try {
        yield (0, db_1.query)('USE ??', [database]);
        const structure = yield (0, db_1.query)('DESCRIBE ??', [table]);
        const indexes = yield (0, db_1.query)('SHOW INDEX FROM ??', [table]);
        res.json({ structure, indexes });
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching table structure' });
    }
});
exports.getTableStructure = getTableStructure;
const executeQuery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { database, sql } = req.body;
    if (!sql) {
        return res.status(400).json({ error: 'Missing required SQL query' });
    }
    try {
        if (database) {
            yield (0, db_1.query)('USE ??', [database]);
        }
        const result = yield (0, db_1.query)(sql);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Error executing query' });
    }
});
exports.executeQuery = executeQuery;
