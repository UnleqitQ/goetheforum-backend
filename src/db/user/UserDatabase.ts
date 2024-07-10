import pool from "./db";
import {DbUser} from "./types/DbUser";

/**
 * Class to interact with the user table in the database
 */
class UserDatabase {
	
	/**
	 * Create the user table
	 */
	static createTable(): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				CREATE TABLE IF NOT EXISTS users
				(
					ID          SERIAL       NOT NULL,
					username    VARCHAR(255),
					email       VARCHAR(255),
					displayName VARCHAR(255) NOT NULL,
					avatar      BLOB,
					createdAt   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
					deletedAt   TIMESTAMP,
					bannedAt    TIMESTAMP,
					role        INT          NOT NULL,
					
					PRIMARY KEY ( ID ) USING BTREE,
					UNIQUE KEY ( username ) USING BTREE,
					UNIQUE KEY ( email ) USING BTREE
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
	 * Get a user by their ID
	 */
	static getUserById(ID: number): Promise<DbUser | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM users
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
	 * Get a user by their username
	 */
	static getUserByUsername(username: string): Promise<DbUser | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM users
				WHERE username = ?
			`, [username], (err, res) => {
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
	 * Get a user by their email
	 */
	static getUserByEmail(email: string): Promise<DbUser | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM users
				WHERE email = ?
			`, [email], (err, res) => {
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
	 * Get all users
	 */
	static getUsers(): Promise<DbUser[]> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM users
			`, (err, res) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(res);
				}
			});
		});
	}
	
	/**
	 * Create a user
	 * @param user The user information
	 * @returns The ID of the user created
	 */
	static createUser(user: { username: string, email: string, displayName: string, role: number }): Promise<number> {
		return new Promise((resolve, reject) => {
			pool.query(`
				INSERT INTO users (username, email, displayName, role)
				VALUES (?, ?, ?, ?)
			`, [user.username, user.email, user.displayName, user.role], (err, res) => {
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
	 * Update a user's display name
	 * @param ID The ID of the user to update
	 * @param displayName The new display name
	 */
	static updateUserDisplayName(ID: number, displayName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET displayName = ?
				WHERE ID = ?
			`, [displayName, ID], (err) => {
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
	 * Update a user's avatar
	 * @param ID The ID of the user to update
	 * @param avatar The new avatar
	 */
	static updateUserAvatar(ID: number, avatar: Buffer | null): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET avatar = ?
				WHERE ID = ?
			`, [avatar, ID], (err) => {
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
	 * Delete a user (soft delete)
	 * @param ID The ID of the user to delete
	 */
	static deleteUser(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET deletedAt = CURRENT_TIMESTAMP,
				    username = NULL, /* F*** legal requirements */
				    email = NULL /* F*** legal requirements, again */
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
	 * Ban a user
	 * @param ID The ID of the user to ban
	 */
	static banUser(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET bannedAt = CURRENT_TIMESTAMP
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
	 * Unban a user
	 * @param ID The ID of the user to unban
	 */
	static unbanUser(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET bannedAt = NULL
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
	 * Update a user's role
	 * @param ID The ID of the user to update
	 * @param role The new role
	 */
	static updateUserRole(ID: number, role: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET role = ?
				WHERE ID = ?
			`, [role, ID], (err) => {
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
	 * Remove a user from the database (hard delete) (use with caution)
	 */
	static removeUser(ID: number): Promise<void> {
		console.warn("Completely removing a user from the database (hard delete) is dangerous and should be used with caution");
		console.log("Removing user with ID", ID, "from the database");
		
		return new Promise((resolve, reject) => {
			pool.query(`
				DELETE FROM users
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

export default UserDatabase;
