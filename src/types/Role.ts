/**
 * The different roles a user can have<br>
 * The roles are hierarchical, meaning that a user with a higher role can do everything a user with a lower role can do.<br>
 * Actions that have effects on other users (e.g. deleting posts, banning users) can only be done by users with a higher role than the user they are affecting.<br>
 * Exception is {@link Role.SYSTEM} and {@link Role.OWNER}, which can do everything, regardless of the role of the user they are affecting.
 */
export const Role = {
	/**
	 * The user has not verified their email address
	 */
	UNVERIFIED: 'UNVERIFIED',
	/**
	 * The user is a regular user
	 */
	USER: 'USER',
	/**
	 * The user is a moderator (can delete posts, ban users, etc.)
	 */
	MODERATOR: 'MODERATOR',
	/**
	 * The user is an admin (can do everything)
	 */
	ADMIN: 'ADMIN',
	/**
	 * The user can do everything, regardless of the role of the user they are affecting
	 */
	OWNER: 'OWNER',
	
	/**
	 * The user is meant for system use only<br>
	 * Users with this role cannot log in
	 */
	SYSTEM: 'SYSTEM',
};

export type Role = typeof Role[keyof typeof Role];

/**
 * The values should be unique and should not be changed as they are used in the database<br>
 * For the levels, see {@link RoleLevel}
 */
export const RoleId: { [key in Role]: number } = {
	UNVERIFIED: 0,
	USER: 1,
	MODERATOR: 2,
	ADMIN: 3,
	OWNER: 4,
	
	SYSTEM: -1,
};

/**
 * This object maps the role IDs to the roles<br>
 * This object is generated from {@link RoleId} (the keys and values are swapped)
 */
export const RoleById: { [key: number]: Role } = Object.fromEntries(
	Object.entries(RoleId).map(([key, value]) => [value, key as Role]) as [number, Role][]);

/**
 * This object defines the hierarchy of the roles<br>
 * The higher the number, the higher the role<br>
 * These values are allowed to be changed
 */
export const RoleLevel: { [key in Role]: number } = {
	UNVERIFIED: -1,
	USER: 0,
	MODERATOR: 10,
	ADMIN: 100,
	OWNER: 9999998,
	
	SYSTEM: 9999999,
};

export const getRole = (role: Role | number): Role => {
	return typeof role === 'number' ? RoleById[role] : role;
}
export const getRoleID = (role: Role | number): number => {
	return typeof role === 'number' ? role : RoleId[role];
}
