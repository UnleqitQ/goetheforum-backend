import {DbAccount, AccountDatabase} from '../../db/user';
import User from './User';
import {createHash} from 'crypto';

const hashAlgorithm = process.env.HASH_ALGORITHM || 'sha512';

class Account {
	
	private readonly _ID: number;
	private _userId: number;
	private _password: Buffer;
	private _otpSecret: string | null;
	private _recoveryCodes: string[];
	private _user: User | null;
	
	private constructor(account: DbAccount) {
		this._ID = account.ID;
		this._userId = account.userId;
		this._password = account.password;
		this._otpSecret = account.otpSecret;
		this._recoveryCodes = account.recoveryCodes.split(',');
		this._user = null;
	}
	
	public get ID(): number {
		return this._ID;
	}
	
	public get userId(): number {
		return this._userId;
	}
	
	public get password(): Buffer {
		return this._password;
	}
	
	public get otpSecret(): string | null {
		return this._otpSecret;
	}
	
	public get recoveryCodes(): string[] {
		return this._recoveryCodes;
	}
	
	public get user(): Promise<User> {
		return this.getUser();
	}
	
	public async getUser(refresh: boolean = false): Promise<User> {
		if (!this._user) {
			this._user = await User.byId(this._userId);
			if (!this._user) {
				throw new Error('User not found');
			}
			return this._user;
		}
		if (refresh) {
			await this._user.refreshUser();
		}
		return this._user;
	}
	
	
	public async setOtpSecret(secret: string | null): Promise<void> {
		await AccountDatabase.updateOtpSecret(this._ID, secret);
		this._otpSecret = secret;
	}
	
	public async setRecoveryCodes(codes: string[]): Promise<void> {
		await AccountDatabase.updateRecoveryCodes(this._ID, codes.join(','));
		this._recoveryCodes = codes;
	}
	
	public async useRecoveryCode(code: string, remove: boolean = false): Promise<boolean> {
		const index = this._recoveryCodes.indexOf(code);
		if (index === -1) return false;
		if (remove) {
			this._recoveryCodes.splice(index, 1);
			await this.setRecoveryCodes(this._recoveryCodes);
		}
		return true;
	}
	
	public async setPassword(password: Buffer | string): Promise<void> {
		const pw = typeof password === 'string' ? Account.hashPassword(password) : password;
		await AccountDatabase.updatePassword(this._ID, pw);
		this._password = pw;
	}
	
	public async delete(): Promise<void> {
		await AccountDatabase.deleteAccount(this._ID);
	}
	
	public verifyPassword(password: string): boolean {
		const hash = Account.hashPassword(password);
		return this._password.equals(hash);
	}
	
	public async refreshAccount(): Promise<void> {
		const account = await AccountDatabase.getAccountById(this._ID);
		if (!account) throw new Error('Account not found');
		if (account.userId !== this._userId) {
			console.error('Account data mismatch', account, this);
			this._user = null;
		}
		this._userId = account.userId;
		this._password = account.password;
		this._otpSecret = account.otpSecret;
		this._recoveryCodes = account.recoveryCodes.split(',');
	}
	
	
	public static async byId(ID: number): Promise<Account | null> {
		const account = await AccountDatabase.getAccountById(ID);
		if (!account) return null;
		return new Account(account);
	}
	
	public static async byUserId(userId: number): Promise<Account | null> {
		const account = await AccountDatabase.getAccountByUserId(userId);
		if (!account) return null;
		return new Account(account);
	}
	
	public static createRecoveryCodes(amount: number = 50, length: number = 16): string[] {
		const codes: string[] = [];
		for (let i = 0; i < amount; i++) {
			codes.push(Array.from({length}, () => Math.random().toString(36)[2]).join(''));
		}
		return codes;
	}
	
	public static hashPassword(password: string): Buffer {
		const hash = createHash(hashAlgorithm);
		hash.update(password);
		return hash.digest();
	}
	
	public static async create(userId: number, password: Buffer | string): Promise<Account> {
		const recoveryCodes = Account.createRecoveryCodes();
		const pw = typeof password === 'string' ? Account.hashPassword(password) : password;
		const otpSecret = null;
		const ID = await AccountDatabase.createAccount(userId, pw, otpSecret, recoveryCodes.join(','));
		const account = await Account.byId(ID);
		if (!account) throw new Error('Could not create account');
		return account;
	}
	
}

export default Account;
