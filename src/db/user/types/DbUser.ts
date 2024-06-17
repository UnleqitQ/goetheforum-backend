/**
 * The database representation of a user
 * The account information is stored in the Account table (see DbAccount)
 * All information stored here is (mostly) public
 * Custom information the user can change is stored in the User Information table (see DbUserInfo)
 */
export interface DbUser {
	/**
	 * The ID of the user
	 */
	ID: number;
	
	/**
	 * The username of the user
	 */
	username: string;
	/**
	 * The email of the user
	 */
	email: string;
	
	/**
	 * The display name of the user
	 */
	displayName: string;
	
	/**
	 * The date the user was created
	 */
	createdAt: Date;
	
	/**
	 * The date the user was deleted (if not null, the user is deleted, the account is removed, but the user is still stored in the database)
	 */
	deletedAt: Date | null;
	/**
	 * The date the user was last banned (if not null, the user is banned)
	 */
	bannedAt: Date | null;
	
	/**
	 * The role id of the user (foreign key)
	 */
	role: number;
}
