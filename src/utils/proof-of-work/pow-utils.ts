import {SHA512} from '@noble/hashes/sha512';

/**
 * Hashes the given data using SHA-512
 * @param data The data to hash
 * @returns The hash of the data as a byte array
 */
export const hash = (data: string): Uint8Array => {
	return new SHA512().update(data).digest();
};

/**
 * Calculates the difficulty of the proof of work
 * @param data The data to hash
 * @returns The difficulty of the proof of work
 */
export const calculateDifficulty = (data: string): number => {
	// Calculate the hash of the data
	const hashValue = hash(data);
	// Find the first bit that is not zero
	let difficulty = 0;
	for (let i = 0; i < hashValue.length; i++) {
		const byte = hashValue[i];
		if (byte === 0) {
			difficulty += 8;
		}
		else {
			// Find the first bit that is not zero
			let mask = 0x80;
			while ((byte & mask) === 0) {
				difficulty++;
				mask >>= 1;
			}
			break;
		}
	}
	return difficulty;
};

/**
 * Checks if the given data satisfies the proof of work condition
 * @param data The data to check
 * @param difficulty The number of leading zeroes the hash of the data must have in binary form
 * @returns True if the hash of the data has the required number of leading zeroes, false otherwise
 */
export const checkProofOfWork = (data: string, difficulty: number): boolean => {
	const hashValue = hash(data);
	for (let i = 0; i < difficulty; i++) {
		const byte = i >> 3;
		const bit = i & 0b111;
		if ((hashValue[byte] & (1 << (7 - bit))) !== 0) {
			return false;
		}
	}
	return true;
};

/**
 * Estimates the amount of hashing work needed for a given difficulty
 * @param difficulty The difficulty to estimate the amount of work for
 * @returns The amount of hashes needed to satisfy the difficulty (on average)
 */
export const estimateAmountOfWork = (difficulty: number): number => {
	// One level of difficulty adds 1 leading zero needed
	// As this check is done in binary, 1 bit is needed for each zero
	// Therefore, the amount of work is 2 times more for each level
	return 2 ** difficulty;
};

export const HASHING_SPEED = parseInt(process.env.HASHING_SPEED || '1000');
