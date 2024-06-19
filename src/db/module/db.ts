import dotenv from "dotenv";
import mysql from "mysql";
import path from "node:path";


const dbenv = dotenv.config({
	path: path.resolve(process.cwd(), '.env.db'),
	processEnv: {},
}).parsed!;

const HOST = dbenv.HOST!;
const PORT = parseInt(dbenv.PORT!);
const USER = dbenv.MODULE_USER!;
const PASSWORD = dbenv.MODULE_PASSWORD!;
const DATABASE = dbenv.MODULE_DATABASE!;

const pool = mysql.createPool({
	host: HOST,
	port: PORT,
	user: USER,
	password: PASSWORD,
	database: DATABASE,
	
	connectionLimit: 20,
});

export default pool;
