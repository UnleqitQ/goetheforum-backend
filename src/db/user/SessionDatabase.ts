import pool from './db';
import {DbSession} from './types/DbSession';

/**
 * Class to interact with the session table in the database
 */
class SessionDatabase {
	
	private static get SQL_SESSION_EXPIRATION(): string {
		const sExpirationTime = (process.env.SESSION_EXPIRATION_TIME || '1d').replace(' ', '')
		.toLowerCase();
		if (!sExpirationTime.match(/^\d+[dwmy]?$/)) {
			throw new Error('Invalid session expiration time');
		}
		
		const unit = sExpirationTime.replace(/\d/g, '') || 'd';
		const amount = parseInt(sExpirationTime.replace(/\D/g, ''));
		const sqlUnit = {
			d: 'DAY',
			w: 'WEEK',
			m: 'MONTH',
			y: 'YEAR'
		}[unit];
		
		return `INTERVAL ${amount} ${sqlUnit}`;
	}
	
	/**
	 * Create the session table
	 */
	static createTable(): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				CREATE TABLE IF NOT EXISTS sessions
				(
					ID       SERIAL          NOT NULL,
					userId   BIGINT UNSIGNED NOT NULL,
					token    VARCHAR(255)    NOT NULL,
					created  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
					expires  TIMESTAMP       NOT NULL,
					lastUsed TIMESTAMP       NOT NULL,
					
					PRIMARY KEY ( ID ) USING BTREE,
					UNIQUE Key ( token, userId ) USING HASH,
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
	 * Insert a new session into the database
	 * @param userId The ID of the user
	 * @param token The session token
	 * @returns The ID of the new session
	 */
	static createSession(userId: number, token: string): Promise<number> {
		return new Promise((resolve, reject) => {
			pool.query(`
				INSERT INTO sessions (userId, token, expires, lastUsed)
				VALUES (?, ?, NOW() + ${SessionDatabase.SQL_SESSION_EXPIRATION}, NOW())
			`, [userId, token], (err, res) => {
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
	 * Get a session by the ID
	 * @param ID The ID of the session
	 */
	static getSessionById(ID: number): Promise<DbSession | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM sessions
				WHERE ID = ?
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
	 * Get a session by user ID and token
	 * @param userId The ID of the user
	 * @param token The session token
	 */
	static getSessionByUserIdAndToken(userId: number, token: string): Promise<DbSession | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM sessions
				WHERE userId = ? AND token = ?
			`, [userId, token], (err, res) => {
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
	 * Delete a session by the ID
	 * @param ID The ID of the session
	 */
	static deleteSessionById(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				DELETE FROM sessions
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
	
	/**
	 * Delete all sessions for a user
	 * @param userId The ID of the user
	 */
	static deleteSessionsByUserId(userId: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				DELETE FROM sessions
				WHERE userId = ?
			`, [userId], (err) => {
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
	 * Update the last used time of a session
	 * @param ID The ID of the session
	 */
	static updateLastUsed(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE sessions
				SET lastUsed = NOW()
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
	
	/**
	 * Delete all expired sessions
	 */
	static deleteExpiredSessions(): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				DELETE FROM sessions
				WHERE expires < NOW()
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
	
}

export default SessionDatabase;
