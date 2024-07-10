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
	 * The username of the user (null if the user is deleted, because of the unique constraint on the username column, and the legal requirements for storing user data)
	 */
	username: string | null;
	/**
	 * The email of the user (null if the user is deleted, because of the unique constraint on the email column, and the legal requirements for storing user data)
	 */
	email: string | null;
	
	/**
	 * The display name of the user
	 */
	displayName: string;
	
	/**
	 * An avatar image of the user (null if the user has no avatar)
	 */
	avatar: Buffer | null;
	
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
	 * The role id of the user
	 */
	role: number;
	
	/**
	 * The proof of work associated with the user
	 */
	proofOfWork: string | null;
}
