import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import {createUserTables} from './db/user';

const PORT = parseInt(process.env.PORT || '3000');

const setup = async () => {
	await createUserTables();
};

setup().then(() => {
	console.log('Database is ready');
}).catch((err) => {
	console.error(err);
	process.exit(1);
});

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
