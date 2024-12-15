import { Request, Response } from 'express';
import { query, createConnection, closeConnection, QueryResult } from '../config/db';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

interface Database {
  Database: string;
}

interface TableInfo {
  [key: string]: string;
}

interface ShowTablesResult {
  [key: `Tables_in_${string}`]: string;
}

interface TableStructure {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

interface TableIndex {
  Table: string;
  Non_unique: number;
  Key_name: string;
  Seq_in_index: number;
  Column_name: string;
  Collation: string | null;
  Cardinality: number;
  Sub_part: number | null;
  Packed: string | null;
  Null: string;
  Index_type: string;
  Comment: string;
  Index_comment: string;
}

interface CreateTableResult {
  'Create Table': string;
}

export const connect = async (req: Request, res: Response) => {
  const { host, user, password } = req.body;
  
  if (!host || !user) {
    return res.status(400).json({ error: 'Missing required connection parameters (host or user)' });
  }

  try {
    const result = await createConnection({ 
      host, 
      user, 
      password: password || '' 
    });
    
    if (result.success) {
      console.log('Connection successful');
      return res.status(200).json({ message: 'Connected successfully' });
    } else {
      console.error('Connection failed:', result.error);
      return res.status(400).json({ 
        error: 'Connection failed', 
        details: result.error
      });
    }
  } catch (err) {
    console.error('Server error during connection:', err);
    const errorMessage = err && typeof err === 'object' && 'message' in err
      ? String(err.message)
      : 'Unknown server error';
    return res.status(500).json({ 
      error: 'Error connecting to database',
      details: errorMessage
    });
  }
};

export const disconnect = async (req: Request, res: Response) => {
  try {
    closeConnection();
    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error disconnecting from database' });
  }
};

export const getDatabases = async (req: Request, res: Response) => {
  try {
    const databases = await query<Database>('SHOW DATABASES');
    res.json(databases);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching databases' });
  }
};

export const createDatabase = async (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    await query('CREATE DATABASE ??', [name]);
    res.json({ message: `Database ${name} created successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Error creating database' });
  }
};

export const deleteDatabase = async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    await query('DROP DATABASE ??', [name]);
    res.json({ message: `Database ${name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting database' });
  }
};

export const getTables = async (req: Request, res: Response) => {
  const { database } = req.params;
  try {
    await query('USE ??', [database]);
    const tables = await query<ShowTablesResult>('SHOW TABLES');
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tables' });
  }
};

export const getTableStructure = async (req: Request, res: Response) => {
  const { database, table } = req.params;
  try {
    await query('USE ??', [database]);
    const structure = await query<TableStructure>('DESCRIBE ??', [table]);
    const indexes = await query<TableIndex>('SHOW INDEX FROM ??', [table]);
    res.json({ structure, indexes });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching table structure' });
  }
};

export const getTableData = async (req: Request, res: Response) => {
  const { database, table } = req.params;
  const { limit = 10, offset = 0, search = '' } = req.query;

  try {
    await query('USE ??', [database]);

    // Convert limit and offset to numbers
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
    const offsetNum = Math.max(0, parseInt(offset as string) || 0);

    // Get total count first
    const countResult = await query('SELECT COUNT(*) as total FROM ??', [table]);
    const total = countResult[0].total;

    // Get paginated data
    let sql = 'SELECT * FROM ??';
    const params: any[] = [table];

    if (search) {
      // Get all columns for the table
      const columns = await query(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
        [database, table]
      );
      
      // Build search conditions for each column
      const searchConditions = columns
        .map((col: any) => `CAST(?? AS CHAR) LIKE ?`)
        .join(' OR ');
      
      sql += ` WHERE ${searchConditions}`;
      
      // Add parameters for each column
      columns.forEach((col: any) => {
        params.push(col.COLUMN_NAME, `%${search}%`);
      });
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offsetNum);

    const data = await query(sql, params);

    res.json({
      data,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error: any) {
    if (error.code === 'ER_UNKNOWN_TABLE') {
      res.status(404).json({ error: `Table '${table}' does not exist in database '${database}'` });
    } else {
      res.status(500).json({ error: 'Error fetching table data: ' + error.message });
    }
  }
};

export const updateTableData = async (req: Request, res: Response) => {
  const { database, table, id } = req.params;
  const rowData = req.body;
  
  try {
    await query('USE ??', [database]);
    
    // Get primary key column
    const tableInfo = await query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = "PRIMARY"',
      [database, table]
    );
    
    if (!tableInfo.length) {
      return res.status(400).json({ error: 'Table must have a primary key for updates' });
    }
    
    const primaryKey = tableInfo[0].COLUMN_NAME;
    
    // Remove primary key from update data if present
    const updateData = { ...rowData };
    delete updateData[primaryKey];
    
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (keys.length === 0) {
      return res.status(400).json({ error: 'No data to update' });
    }
    
    const updateQuery = `UPDATE ?? SET ${keys.map(key => `?? = ?`).join(', ')} WHERE ?? = ?`;
    await query(updateQuery, [
      table,
      ...keys.map(key => [key, updateData[key]]).flat(),
      primaryKey,
      id
    ]);
    
    res.json({ message: 'Record updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error updating record: ' + error.message });
  }
};

export const deleteTableData = async (req: Request, res: Response) => {
  const { database, table, id } = req.params;
  
  try {
    await query('USE ??', [database]);
    
    // Get primary key column
    const tableInfo = await query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = "PRIMARY"',
      [database, table]
    );
    
    if (!tableInfo.length) {
      return res.status(400).json({ error: 'Table must have a primary key for deletion' });
    }
    
    const primaryKey = tableInfo[0].COLUMN_NAME;
    
    await query('DELETE FROM ?? WHERE ?? = ?', [table, primaryKey, id]);
    res.json({ message: 'Record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error deleting record: ' + error.message });
  }
};

export const insertTableData = async (req: Request, res: Response) => {
  const { database, table } = req.params;
  const rowData = req.body;
  
  try {
    await query('USE ??', [database]);
    
    // Get table columns to validate input
    const columns = await query(
      'SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [database, table]
    );
    
    const requiredColumns = columns
      .filter((col: any) => col.IS_NULLABLE === 'NO' && col.COLUMN_KEY !== 'PRI')
      .map((col: any) => col.COLUMN_NAME);
    
    // Check if all required columns are provided
    const missingColumns = requiredColumns.filter(col => !(col in rowData));
    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }
    
    const keys = Object.keys(rowData);
    const values = Object.values(rowData);
    
    const insertQuery = `INSERT INTO ?? (${keys.map(() => '??').join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
    await query(insertQuery, [table, ...keys, ...values]);
    
    res.json({ message: 'Record inserted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error inserting record: ' + error.message });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  const { database, table } = req.params;
  
  try {
    await query('USE ??', [database]);
    await query('DROP TABLE ??', [table]);
    res.json({ message: `Table ${table} deleted successfully` });
  } catch (error: any) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Error deleting table: ' + error.message });
  }
};

export const exportTable = async (req: Request, res: Response) => {
  const { database, table } = req.params;
  
  try {
    await query('USE ??', [database]);
    const data = await query('SELECT * FROM ??', [table]);
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${table}_export.csv`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Error exporting table: ' + error.message });
  }
};

export const exportDatabase = async (req: Request, res: Response) => {
  const { database } = req.params;
  
  try {
    // Get the database structure
    await query('USE ??', [database]);
    
    // Get all tables
    const tables = await query<ShowTablesResult>('SHOW TABLES');
    
    let dumpContent = `-- MySQL dump for database ${database}\n\n`;
    dumpContent += `CREATE DATABASE IF NOT EXISTS \`${database}\`;\n`;
    dumpContent += `USE \`${database}\`;\n\n`;
    
    // For each table
    for (const tableObj of tables) {
      const tableName = tableObj[`Tables_in_${database}`];
      if (!tableName) continue;
      
      // Get create table statement
      const createTableResult = await query<CreateTableResult>('SHOW CREATE TABLE ??', [tableName]);
      const createTableStatement = createTableResult[0]['Create Table'];
      
      dumpContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      dumpContent += createTableStatement + ';\n\n';
      
      // Get table data
      const tableData = await query('SELECT * FROM ??', [tableName]);
      
      if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]);
        const values = tableData.map(row => 
          '(' + columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            return `'${val.toString().replace(/'/g, "\\'")}'`;
          }).join(', ') + ')'
        );
        
        dumpContent += `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES\n`;
        dumpContent += values.join(',\n') + ';\n\n';
      }
    }
    
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=${database}_dump.sql`);
    res.send(dumpContent);
    
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Error exporting database: ' + error.message });
  }
};

export const importDatabase = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No SQL file provided' });
  }
  
  try {
    const sqlContent = req.file.buffer.toString();
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0);
    
    for (const sqlQuery of queries) {
      try {
        await query(sqlQuery);
      } catch (queryError: any) {
        // Log the error but continue with other queries
        console.error('Query error:', queryError.message);
      }
    }
    
    res.json({ message: 'Database imported successfully' });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Error importing database: ' + error.message });
  }
};

export const executeQuery = async (req: Request, res: Response) => {
  const { database, sql } = req.body;
  try {
    if (database) {
      await query('USE ??', [database]);
    }
    const result = await query(sql);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error executing query' });
  }
};

export const clearTable = async (req: Request, res: Response) => {
  const { database, table } = req.params;
  
  try {
    await query('USE ??', [database]);
    
    // First check if table exists
    const tableExists = await query(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [database, table]
    );
    
    if (!tableExists[0].count) {
      return res.status(404).json({ error: `Table '${table}' does not exist in database '${database}'` });
    }

    // Use TRUNCATE for faster clearing of table
    await query('TRUNCATE TABLE ??', [table]);
    
    res.json({ message: `Table ${table} cleared successfully` });
  } catch (error: any) {
    console.error('Clear table error:', error);
    res.status(500).json({ error: 'Error clearing table: ' + error.message });
  }
};
