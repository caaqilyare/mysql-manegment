"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const databaseController_1 = require("../controllers/databaseController");
const router = express_1.default.Router();
// Connection management
router.post('/connect', databaseController_1.connect);
router.post('/disconnect', databaseController_1.disconnect);
// Database operations
router.get('/databases', databaseController_1.getDatabases);
router.post('/databases', databaseController_1.createDatabase);
router.delete('/databases/:name', databaseController_1.deleteDatabase);
// Table operations
router.get('/databases/:database/tables', databaseController_1.getTables);
router.get('/databases/:database/tables/:table', databaseController_1.getTableStructure);
// Query execution
router.post('/query', databaseController_1.executeQuery);
exports.default = router;
