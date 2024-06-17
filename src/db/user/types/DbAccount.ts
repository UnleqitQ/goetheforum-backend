/**
 * The database representation of a user account (password, otp secret, recovery codes)
 * The user itself is stored in the User table (see DbUser)
 */
export interface DbAccount {
	/**
	 * The ID of the user
	 */
	ID: number;
	
	/**
	 * The id of the user (foreign key)
	 */
	userId: number;
	
	/**
	 * The hashed password of the user
	 */
	password: Buffer;
	
	/**
	 * The otp secret of the user (if any)
	 */
	otpSecret: string | null;
	/**
	 * The recovery codes of the user (separated by a comma)
	 */
	recoveryCodes: string;
}
