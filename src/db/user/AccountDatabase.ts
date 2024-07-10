import pool from './db';
import {DbAccount} from './types/DbAccount';

/**
 * Class to interact with the account table in the database
 */
class AccountDatabase {
	
	/**
	 * Create the account table
	 */
	static createTable(): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				CREATE TABLE IF NOT EXISTS accounts
				(
					ID            SERIAL          NOT NULL,
					userId        BIGINT UNSIGNED NOT NULL,
					password      TINYBLOB        NOT NULL,
					otpSecret     VARCHAR(255),
					recoveryCodes VARCHAR(850)    NOT NULL,
					
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
	 * Get an account by the ID
	 */
	static getAccountById(ID: number): Promise<DbAccount | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM accounts
				WHERE ID = ?
			`, [ID], (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(res[0] || null);
				}
			});
		});
	}
	
	/**
	 * Get an account by the user ID
	 */
	static getAccountByUserId(userId: number): Promise<DbAccount | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM accounts
				WHERE userId = ?
			`, [userId], (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(res[0] || null);
				}
			});
		});
	}
	
	/**
	 * Create an account
	 * @param userId The ID of the user
	 * @param password The hashed password
	 * @param otpSecret The otp secret (if any)
	 * @param recoveryCodes The recovery codes (separated by a comma)
	 * @returns The ID of the account created
	 */
	static createAccount(userId: number, password: Buffer, otpSecret: string | null, recoveryCodes: string): Promise<number> {
		return new Promise((resolve, reject) => {
			pool.query(`
				INSERT INTO accounts (userId, password, otpSecret, recoveryCodes)
				VALUES (?, ?, ?, ?)
			`, [userId, password, otpSecret, recoveryCodes], (err, res) => {
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
	 * Update the password of an account
	 * @param ID The ID of the account
	 * @param password The new hashed password
	 */
	static updatePassword(ID: number, password: Buffer): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE accounts
				SET password = ?
				WHERE ID = ?
			`, [password, ID], (err) => {
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
	 * Update the otp secret of an account
	 * @param ID The ID of the account
	 * @param otpSecret The new otp secret (or null if removing)
	 */
	static updateOtpSecret(ID: number, otpSecret: string | null): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE accounts
				SET otpSecret = ?
				WHERE ID = ?
			`, [otpSecret, ID], (err) => {
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
	 * Update the recovery codes of an account
	 * @param ID The ID of the account
	 * @param recoveryCodes The new recovery codes
	 */
	static updateRecoveryCodes(ID: number, recoveryCodes: string): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE accounts
				SET recoveryCodes = ?
				WHERE ID = ?
			`, [recoveryCodes, ID], (err) => {
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
	 * Delete an account
	 * @param ID The ID of the account
	 */
	static deleteAccount(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				DELETE
				FROM accounts
				WHERE ID = ?
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

export default AccountDatabase;
