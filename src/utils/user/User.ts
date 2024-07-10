import {DbUser, UserDatabase} from '../../db/user';
import {getRole, getRoleID, Role, RoleById, RoleId} from '../../types/Role';
import {UserData} from '../../types/user/UserData';

class User {
	
	private readonly _ID: number;
	private _username: string | null;
	private _email: string | null;
	private _displayName: string;
	private _createdAt: Date;
	private _deletedAt: Date | null;
	private _bannedAt: Date | null;
	private _role: Role;
	private _avatar: Buffer | null;
	private _proofOfWork: string | null;
	
	private constructor(user: DbUser) {
		this._ID = user.ID;
		this._username = user.username;
		this._email = user.email;
		this._displayName = user.displayName;
		this._createdAt = user.createdAt;
		this._deletedAt = user.deletedAt;
		this._bannedAt = user.bannedAt;
		this._role = getRole(user.role);
		this._avatar = user.avatar;
		this._proofOfWork = user.proofOfWork;
	}
	
	public get ID(): number {
		return this._ID;
	}
	
	public get username(): string | null {
		return this._username;
	}
	
	public get email(): string | null {
		return this._email;
	}
	
	public get displayName(): string {
		return this._displayName;
	}
	
	public get createdAt(): Date {
		return this._createdAt;
	}
	
	public get deletedAt(): Date | null {
		return this._deletedAt;
	}
	
	public get bannedAt(): Date | null {
		return this._bannedAt;
	}
	
	public get role(): Role {
		return this._role;
	}
	
	public get roleID(): number {
		return getRoleID(this._role);
	}
	
	public get avatar(): Buffer | null {
		return this._avatar;
	}
	
	public get avatarBase64(): string | null {
		return this._avatar?.toString('base64') ?? null;
	}
	
	public get proofOfWork(): string | null {
		return this._proofOfWork;
	}
	
	public get data(): UserData {
		return {
			ID: this._ID,
			username: this._username,
			email: this._email,
			displayName: this._displayName,
			createdAt: this._createdAt,
			deletedAt: this._deletedAt,
			bannedAt: this._bannedAt,
			role: this._role,
			avatar: this.avatarBase64,
			proofOfWork: this._proofOfWork,
		};
	}
	
	public get banned(): boolean {
		return !!this._bannedAt;
	}
	
	public get deleted(): boolean {
		return !!this._deletedAt;
	}
	
	
	public async setRole(role: Role | number): Promise<void> {
		await UserDatabase.updateUserRole(this._ID, getRoleID(role));
		this._role = getRole(role);
	}
	
	public async setDisplayName(displayName: string): Promise<void> {
		await UserDatabase.updateUserDisplayName(this._ID, displayName);
		this._displayName = displayName;
	}
	
	public async setAvatar(avatar: Buffer | string | null): Promise<void> {
		if (avatar === null) {
			await UserDatabase.updateUserAvatar(this._ID, null);
			this._avatar = null;
		}
		else {
			const buffer = typeof avatar === 'string' ? Buffer.from(avatar, 'base64') : avatar;
			await UserDatabase.updateUserAvatar(this._ID, buffer);
			this._avatar = buffer;
		}
	}
	
	public async setProofOfWork(proofOfWork: string | null): Promise<void> {
		await UserDatabase.updateUserProofOfWork(this._ID, proofOfWork);
		this._proofOfWork = proofOfWork;
	}
	
	public async ban(): Promise<void> {
		await UserDatabase.banUser(this._ID);
		await this.refreshUser();
	}
	
	public async unban(): Promise<void> {
		await UserDatabase.unbanUser(this._ID);
		await this.refreshUser();
	}
	
	public async delete(): Promise<void> {
		await UserDatabase.deleteUser(this._ID);
		await this.refreshUser();
	}
	
	public async refreshUser(): Promise<void> {
		const user = await UserDatabase.getUserById(this._ID);
		if (!user) throw new Error('User not found');
		this._username = user.username;
		this._email = user.email;
		this._displayName = user.displayName;
		this._createdAt = user.createdAt;
		this._deletedAt = user.deletedAt;
		this._bannedAt = user.bannedAt;
		this._role = getRole(user.role);
		this._avatar = user.avatar;
		this._proofOfWork = user.proofOfWork;
	}
	
	/**
	 * Create a new user
	 * @param username The username of the user
	 * @param email The email of the user
	 * @param displayName The display name of the user (defaults to username)
	 * @param role The role of the user (defaults to {@link Role.UNVERIFIED})
	 */
	public static async create(username: string, email: string, displayName?: string, role: Role | number = Role.UNVERIFIED): Promise<User> {
		const userId = await UserDatabase.createUser(
			{username, email, displayName: displayName ?? username, role: getRoleID(role)});
		const user = await User.byId(userId);
		if (!user) throw new Error('Could not create user');
		return user;
	}
	
	public static async byId(ID: number): Promise<User | null> {
		const user = await UserDatabase.getUserById(ID);
		if (!user) return null;
		return new User(user);
	}
	
	public static async byUsername(username: string): Promise<User | null> {
		const user = await UserDatabase.getUserByUsername(username);
		if (!user) return null;
		return new User(user);
	}
	
	public static async byEmail(email: string): Promise<User | null> {
		const user = await UserDatabase.getUserByEmail(email);
		if (!user) return null;
		return new User(user);
	}
	
	public static async getUsers(): Promise<User[]> {
		const users = await UserDatabase.getUsers();
		return users.map(user => new User(user));
	}
	
	public static async isUsernameTaken(username: string): Promise<boolean> {
		return !!(await UserDatabase.getUserByUsername(username));
	}
	
	public static async isEmailTaken(email: string): Promise<boolean> {
		return !!(await UserDatabase.getUserByEmail(email));
	}
	
}

export default User;
