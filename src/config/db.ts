import mysql from 'mysql2';

interface DatabaseConfig {
  host: string;
  user: string;
  password?: string;
  database?: string;
}

interface PoolConfig extends mysql.PoolOptions {
  host: string;
  user: string;
  password?: string;
  database?: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

export type QueryResult<T = any> = T[];

interface ConnectionResult {
  success: boolean;
  error?: string;
}

let pool: mysql.Pool | null = null;

export const createConnection = async (config: DatabaseConfig): Promise<ConnectionResult> => {
  try {
    if (pool) {
      await closeConnection();
    }

    const poolConfig: PoolConfig = {
      host: config.host,
      user: config.user,
      password: config.password || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    if (config.database) {
      poolConfig.database = config.database;
    }

    pool = mysql.createPool(poolConfig);

    // Test connection
    const connection = await pool.promise().getConnection();
    console.log('Successfully connected to the database.');
    connection.release();
    return { success: true };
  } catch (err) {
    console.error('Error connecting to the database:', err);
    const errorMessage = err && typeof err === 'object' && 'message' in err
      ? String(err.message)
      : 'Unknown connection error';
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

export const query = async <T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> => {
  if (!pool) {
    throw new Error('Database connection not established');
  }

  try {
    const [rows] = await pool.promise().query(sql, params);
    return rows as QueryResult<T>;
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  }
};

export const closeConnection = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export default pool;
