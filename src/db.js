import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

try {
    const connection = await db.getConnection();

    console.log("MySQL connected successfully");

    connection.release();
} catch (error) {
    console.error("MySQL connection failed:", error.message);
}

export default db;