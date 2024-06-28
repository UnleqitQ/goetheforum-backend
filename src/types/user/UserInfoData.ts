export interface UserInfoData {
	/**
	 * The id of the user (foreign key)
	 */
	userId: number;
	
	/**
	 * The user's profile picture
	 */
	profilePicture: string | null;
	/**
	 * The user's bio
	 */
	bio: string | null;
	
	/**
	 * The user's website
	 */
	website: string | null;
	/**
	 * The user's location (this has no specific format)
	 */
	location: string | null;
	
	/**
	 * The user's date of birth
	 */
	dateOfBirth: Date | null;
	
	/**
	 * The user's phone number
	 */
	phoneNumber: string | null;
	
	/**
	 * The preferred language of the user (two-letter language code)
	 */
	preferredLanguage: string | null;
	
	/**
	 * The languages the user speaks (two-letter language codes)
	 */
	languages: string[] | null;
}
