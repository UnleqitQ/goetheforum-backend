import {Role} from '../Role';

/**
 * The data of a user (for requests)
 */
export interface UserData {
	/**
	 * The id of the user
	 */
	ID: number;
	/**
	 * The username of the user
	 */
	username: string | null;
	/**
	 * The email of the user
	 */
	email: string | null;
	/**
	 * The role of the user
	 */
	role: Role;
	/**
	 * The display name of the user
	 */
	displayName: string;
	/**
	 * The date the user was created
	 */
	createdAt: Date;
	/**
	 * The date the user was deleted
	 */
	deletedAt: Date | null;
	/**
	 * The date the user was banned
	 */
	bannedAt: Date | null;
}