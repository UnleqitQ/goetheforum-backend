import pool from './db';
import {DbUserInfo} from './types/DbUserInfo';

/**
 * Class to interact with the user info table in the database
 */
class UserInfoDatabase {
	
	/**
	 * Create the user info table
	 */
	static createTable(): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				CREATE TABLE IF NOT EXISTS user_info
				(
					ID                SERIAL       NOT NULL,
					userId            INT          NOT NULL,
					profilePicture    BLOB,
					bio               TEXT         NOT NULL DEFAULT '',
					website           VARCHAR(255),
					location          VARCHAR(255),
					dateOfBirth       DATE,
					phoneNumber       VARCHAR(15),
					preferredLanguage VARCHAR(2),
					languages         VARCHAR(255) NOT NULL DEFAULT '',
					
					PRIMARY KEY ( ID ) USING BTREE,
					FOREIGN KEY ( userId ) REFERENCES users ( ID ) ON DELETE CASCADE
				)
			`, (err) => {
				if (err) {
					reject(err);
				}
				else {
					resolve();
				}
			});
		});
	}
	
	/**
	 * Get user info by the ID
	 */
	static getUserInfoById(ID: number): Promise<DbUserInfo | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM user_info
				WHERE ID = $1
			`, [ID], (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(res.rows[0] || null);
				}
			});
		});
	}
	
	/**
	 * Get user info by the user ID
	 */
	static getUserInfoByUserId(userId: number): Promise<DbUserInfo | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM user_info
				WHERE userId = $1
			`, [userId], (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(res.rows[0] || null);
				}
			});
		});
	}
	
	/**
	 * Create user info
	 */
	static createUserInfo(userId: number): Promise<number> {
		return new Promise((resolve, reject) => {
			pool.query(`
				INSERT INTO user_info (userId)
				VALUES ($1)
			`, [userId], (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(res.insertId);
				}
			});
		});
	}
	
	/**
	 * Update user info
	 */
	static updateUserInfo(ID: number, info: Partial<DbUserInfo>): Promise<void> {
		const modifiableKeys: readonly (keyof DbUserInfo)[]
			= ['profilePicture', 'bio', 'website', 'location', 'dateOfBirth', 'phoneNumber',
			'preferredLanguage', 'languages'] as const;
		return new Promise((resolve, reject) => {
			const keys = Object.keys(info)
			.filter(key => modifiableKeys.includes(key as keyof DbUserInfo));
			const set = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
			const values = keys.map(key => info[key as keyof DbUserInfo]);
			pool.query(`
				UPDATE user_info
				SET ${set}
				WHERE ID = $1
			`, [ID, ...values], (err) => {
				if (err) {
					reject(err);
				}
				else {
					resolve();
				}
			});
		});
	}
	
	/**
	 * Delete user info
	 */
	static deleteUserInfo(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				DELETE
				FROM user_info
				WHERE ID = $1
			`, [ID], (err) => {
				if (err) {
					reject(err);
				}
				else {
					resolve();
				}
			});
		});
	}
	
}

export default UserInfoDatabase;
