import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Mangharam#2004',
    database: 'retail_store_db'
};

const createConnection = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');
        return connection;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

export { createConnection };