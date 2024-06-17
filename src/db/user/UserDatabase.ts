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
	 * Get a user by their username
	 */
	static getUserByUsername(username: string): Promise<DbUser | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM users
				WHERE username = $1
			`, [username], (err, res) => {
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
	 * Get a user by their email
	 */
	static getUserByEmail(email: string): Promise<DbUser | null> {
		return new Promise((resolve, reject) => {
			pool.query(`
				SELECT *
				FROM users
				WHERE email = $1
			`, [email], (err, res) => {
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
					resolve(res.rows);
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
				VALUES ($1, $2, $3, $4)
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
				SET displayName = $1
				WHERE ID = $2
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
	
	/**
	 * Ban a user
	 * @param ID The ID of the user to ban
	 */
	static banUser(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET bannedAt = CURRENT_TIMESTAMP
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
	
	/**
	 * Unban a user
	 * @param ID The ID of the user to unban
	 */
	static unbanUser(ID: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET bannedAt = NULL
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
	
	/**
	 * Update a user's role
	 * @param ID The ID of the user to update
	 * @param role The new role
	 */
	static updateUserRole(ID: number, role: number): Promise<void> {
		return new Promise((resolve, reject) => {
			pool.query(`
				UPDATE users
				SET role = $1
				WHERE ID = $2
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

export default UserDatabase;
