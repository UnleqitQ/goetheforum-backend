import {DbUserInfo, UserInfoDatabase} from '../../db/user';
import {UserInfoData} from '../../types/user/UserInfoData';

class UserInfo {
	
	private readonly _ID: number;
	private readonly _userId: number;
	private _profilePicture: Buffer | null;
	private _bio: string;
	private _website: string | null;
	private _location: string | null;
	private _dateOfBirth: Date | null;
	private _phoneNumber: string | null;
	private _preferredLanguage: string | null;
	private _languages: string;
	
	private constructor(userInfo: DbUserInfo) {
		this._ID = userInfo.ID;
		this._userId = userInfo.userId;
		this._profilePicture = userInfo.profilePicture;
		this._bio = userInfo.bio;
		this._website = userInfo.website;
		this._location = userInfo.location;
		this._dateOfBirth = userInfo.dateOfBirth;
		this._phoneNumber = userInfo.phoneNumber;
		this._preferredLanguage = userInfo.preferredLanguage;
		this._languages = userInfo.languages;
	}
	
	public get ID(): number {
		return this._ID;
	}
	
	public get userId(): number {
		return this._userId;
	}
	
	public get profilePicture(): Buffer | null {
		return this._profilePicture;
	}
	
	public get bio(): string {
		return this._bio;
	}
	
	public get website(): string | null {
		return this._website;
	}
	
	public get location(): string | null {
		return this._location;
	}
	
	public get dateOfBirth(): Date | null {
		return this._dateOfBirth;
	}
	
	public get phoneNumber(): string | null {
		return this._phoneNumber;
	}
	
	public get preferredLanguage(): string | null {
		return this._preferredLanguage;
	}
	
	public get languages(): string {
		return this._languages;
	}
	
	public get data(): UserInfoData {
		return {
			userId: this.userId,
			profilePicture: this.profilePicture,
			bio: this.bio,
			website: this.website,
			location: this.location,
			dateOfBirth: this.dateOfBirth,
			phoneNumber: this.phoneNumber,
			preferredLanguage: this.preferredLanguage,
			languages: this.languages.split(','),
		};
	}
	
	public async setProfilePicture(profilePicture: Buffer | null): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {profilePicture});
		this._profilePicture = profilePicture;
	}
	
	public async setBio(bio: string): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {bio});
		this._bio = bio;
	}
	
	public async setWebsite(website: string | null): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {website});
		this._website = website;
	}
	
	public async setLocation(location: string | null): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {location});
		this._location = location;
	}
	
	public async setDateOfBirth(dateOfBirth: Date | null): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {dateOfBirth});
		this._dateOfBirth = dateOfBirth;
	}
	
	public async setPhoneNumber(phoneNumber: string | null): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {phoneNumber});
		this._phoneNumber = phoneNumber;
	}
	
	public async setPreferredLanguage(preferredLanguage: string | null): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {preferredLanguage});
		this._preferredLanguage = preferredLanguage;
	}
	
	public async setLanguages(languages: string): Promise<void> {
		await UserInfoDatabase.updateUserInfo(this.ID, {languages});
		this._languages = languages;
	}
	
	public async delete(): Promise<void> {
		await UserInfoDatabase.deleteUserInfo(this.ID);
	}
	
	public static async byId(ID: number): Promise<UserInfo | null> {
		const userInfo = await UserInfoDatabase.getUserInfoById(ID);
		if (userInfo === null) {
			return null;
		}
		return new UserInfo(userInfo);
	}
	
	public static async byUserId(userId: number, createIfNotExists: boolean = true): Promise<UserInfo | null> {
		const userInfo = await UserInfoDatabase.getUserInfoByUserId(userId);
		if (userInfo === null) {
			if (!createIfNotExists) {
				return null;
			}
			return UserInfo.create(userId);
		}
		return new UserInfo(userInfo);
	}
	
	public static async create(userId: number): Promise<UserInfo> {
		const ID = await UserInfoDatabase.createUserInfo(userId);
		const userInfo = await UserInfoDatabase.getUserInfoById(ID);
		if (userInfo === null) {
			throw new Error('Failed to create user info');
		}
		return new UserInfo(userInfo);
	}
	
}

export default UserInfo;
