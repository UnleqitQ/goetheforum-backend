/**
 * The data of a session (for requests)
 */
export interface SessionData {
	/**
	 * The id of the session
	 */
	ID: number;
	/**
	 * The user id of the session
	 */
	userId: number;
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