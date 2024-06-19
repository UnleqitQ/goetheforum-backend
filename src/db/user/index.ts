import AccountDatabase from './AccountDatabase';
import UserDatabase from './UserDatabase';
import SessionDatabase from './SessionDatabase';
import UserInfoDatabase from './UserInfoDatabase';
import {DbUser} from './types/DbUser';
import {DbAccount} from './types/DbAccount';
import {DbSession} from './types/DbSession';
import {DbUserInfo} from './types/DbUserInfo';

const createUserTables = async () => {
	// referenced by other tables so it must be created first
	await UserDatabase.createTable();
	await Promise.all([
		AccountDatabase.createTable(),
		UserInfoDatabase.createTable(),
		SessionDatabase.createTable(),
	]);
};

export {
	AccountDatabase,
	UserDatabase,
	SessionDatabase,
	UserInfoDatabase,
	DbUser,
	DbAccount,
	DbSession,
	DbUserInfo,
	createUserTables,
};
