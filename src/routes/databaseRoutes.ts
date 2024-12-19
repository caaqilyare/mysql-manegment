import express from 'express';
import multer from 'multer';
import {
  connect,
  disconnect,
  getDatabases,
  createDatabase,
  deleteDatabase,
  getTables,
  getTableStructure,
  getTableData,
  updateTableData,
  deleteTableData,
  insertTableData,
  deleteTable,
  exportDatabase,
  importDatabase,
  executeQuery,
  clearTable,
  createTable,
} from '../controllers/databaseController';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database connection routes
router.post('/connect', connect);
router.post('/disconnect', disconnect);

// Database management routes
router.get('/databases', getDatabases);
router.post('/databases', createDatabase);
router.delete('/databases/:name', deleteDatabase);

// Import/Export routes
router.post('/import', upload.single('file'), importDatabase);
router.get('/databases/:database/export', exportDatabase);

// Table management routes
router.get('/databases/:database/tables', getTables);
router.post('/databases/:database/tables', createTable);
router.get('/databases/:database/tables/:table/structure', getTableStructure);
router.get('/databases/:database/tables/:table/data', getTableData);
router.put('/databases/:database/tables/:table/records/:id', updateTableData);
router.delete('/databases/:database/tables/:table/records/:id', deleteTableData);
router.post('/databases/:database/tables/:table/records', insertTableData);
router.delete('/databases/:database/tables/:table', deleteTable);
router.post('/databases/:database/tables/:table/clear', clearTable);

// Query execution route
router.post('/query', executeQuery);

export default router;
