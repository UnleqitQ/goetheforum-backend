/**
 * The database representation of a user session
 * (Ip address would not work when the user is behind a proxy)
 */
export interface DbSession {
	/**
	 * The ID of the session
	 */
	ID: number;
	
	/**
	 * The id of the user (foreign key)
	 */
	userId: number;
	
	/**
	 * The session token (Random string), not to be confused with the JWT token, this is included in the JWT token
	 */
	token: string;
	
	/**
	 * The date the session was created
	 */
	created: Date;
	/**
	 * The expiration date of the session
	 */
	expires: Date;
	
	/**
	 * The date the session was last used
	 */
	lastUsed: Date;
}