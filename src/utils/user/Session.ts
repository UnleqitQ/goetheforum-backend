import {DbSession, SessionDatabase} from '../../db/user';
import {JwtRefreshPayload} from '../jwt/JwtRefresh';
import {JwtAccessPayload} from '../jwt/JwtAccess';
import JwtUtils from '../jwt/JwtUtils';
import {SessionData} from '../../types/user/SessionData';

const sessionTokenLength = parseInt(process.env.SESSION_TOKEN_LENGTH || '64');

class Session {
	
	private readonly _ID: number;
	private _userId: number;
	private _token: string;
	private _created: Date;
	private _expires: Date;
	private _lastUsed: Date;
	
	private constructor(session: DbSession) {
		this._ID = session.ID;
		this._userId = session.userId;
		this._token = session.token;
		this._created = session.created;
		this._expires = session.expires;
		this._lastUsed = session.lastUsed;
	}
	
	public get ID(): number {
		return this._ID;
	}
	
	public get userId(): number {
		return this._userId;
	}
	
	public get token(): string {
		return this._token;
	}
	
	public get created(): Date {
		return this._created;
	}
	
	public get expires(): Date {
		return this._expires;
	}
	
	public get lastUsed(): Date {
		return this._lastUsed;
	}
	
	public get expired(): boolean {
		return this._expires.getTime() < Date.now();
	}
	
	public get refreshToken(): string {
		const payload: JwtRefreshPayload = {
			type: 'refresh',
			user_id: this._userId,
			session_token: this._token,
		};
		return JwtUtils.sign(payload);
	}
	
	public get accessToken(): string {
		const payload: JwtAccessPayload = {
			type: 'access',
			user_id: this._userId,
			session_token: this._token,
		};
		return JwtUtils.sign(payload);
	}
	
	public get data(): SessionData {
		return {
			ID: this._ID,
			userId: this._userId,
			created: this._created,
			expires: this._expires,
			lastUsed: this._lastUsed,
		};
	}
	
	
	public async updateLastUsed(refresh: boolean = false): Promise<void> {
		await SessionDatabase.updateLastUsed(this._ID);
		if (refresh) {
			await this.refresh();
		}
	}
	
	public async delete(): Promise<void> {
		await SessionDatabase.deleteSessionById(this._ID);
	}
	
	public async refresh(): Promise<void> {
		const data = await SessionDatabase.getSessionById(this._ID);
		if (!data) {
			throw new Error('Session not found');
		}
		if (data.userId !== this._userId || data.token !== this._token || data.created.getTime() !== this._created.getTime()) {
			console.error('Session data mismatch', data, this);
		}
		this._userId = data.userId;
		this._token = data.token;
		this._created = data.created;
		this._expires = data.expires;
		this._lastUsed = data.lastUsed;
	}
	
	public static async byId(ID: number): Promise<Session | null> {
		const session = await SessionDatabase.getSessionById(ID);
		if (!session) {
			return null;
		}
		return new Session(session);
	}
	
	public static async byUserIdAndToken(userId: number, token: string): Promise<Session | null> {
		const session = await SessionDatabase.getSessionByUserIdAndToken(userId, token);
		if (!session) {
			return null;
		}
		return new Session(session);
	}
	
	public static createSessionToken(length: number = sessionTokenLength): string {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let token = '';
		for (let i = 0; i < length; i++) {
			token += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		return token;
	}
	
	public static async deleteAllSessions(userId: number): Promise<void> {
		await SessionDatabase.deleteSessionsByUserId(userId);
	}
	
	public static async deleteExpiredSessions(): Promise<void> {
		await SessionDatabase.deleteExpiredSessions();
	}
	
	public static async create(userId: number): Promise<Session> {
		const token = Session.createSessionToken();
		const ID = await SessionDatabase.createSession(userId, token);
		const session = await Session.byId(ID);
		if (!session) throw new Error('Could not create session');
		return session;
	}
	
	public static async byRefreshToken(refreshToken: string): Promise<Session | null> {
		try {
			const payload = JwtUtils.verify<JwtRefreshPayload>(refreshToken, 'refresh');
			if (!payload || payload.type !== 'refresh') {
				return null;
			}
			return await Session.byUserIdAndToken(payload.user_id, payload.session_token);
		}
		catch (e) {
			return null;
		}
	}
	
	public static async byAccessToken(accessToken: string): Promise<Session | null> {
		try {
			const payload = JwtUtils.verify<JwtAccessPayload>(accessToken, 'access');
			if (!payload || payload.type !== 'access') {
				return null;
			}
			return await Session.byUserIdAndToken(payload.user_id, payload.session_token);
		}
		catch (e) {
			return null;
		}
	}
	
}

export default Session;
