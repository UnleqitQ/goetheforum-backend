import imageSize from 'image-size';

export interface ImageData {
	dimensions: {
		width: number;
		height: number;
	};
	format: string;
}

interface ImageCheck {
	width?: number | {
		min?: number;
		max?: number;
	};
	height?: number | {
		min?: number;
		max?: number;
	};
	format?: string | string[];
	fileSize?: {
		min?: number;
		max?: number;
	};
}

class ImageUtils {
	
	public static checkImage(image: Buffer | string, options: ImageCheck): 'fileSize' | 'dimensions' | 'format' | 'invalid' | true {
		const imageBuffer =
			typeof image === 'string' ? Buffer.from(image, 'base64') : image;
		
		if (options.fileSize) {
			if (options.fileSize.min && imageBuffer.length < options.fileSize.min) {
				return 'fileSize';
			}
			if (options.fileSize.max && imageBuffer.length > options.fileSize.max) {
				return 'fileSize';
			}
		}
		
		const data = ImageUtils.getImageData(imageBuffer);
		
		if (!data) {
			return 'invalid';
		}
		
		if (options.width) {
			if (typeof options.width === 'number') {
				if (data.dimensions.width !== options.width) {
					return 'dimensions';
				}
			}
			else {
				if (options.width.min && data.dimensions.width < options.width.min) {
					return 'dimensions';
				}
				if (options.width.max && data.dimensions.width > options.width.max) {
					return 'dimensions';
				}
			}
		}
		
		if (options.height) {
			if (typeof options.height === 'number') {
				if (data.dimensions.height !== options.height) {
					return 'dimensions';
				}
			}
			else {
				if (options.height.min && data.dimensions.height < options.height.min) {
					return 'dimensions';
				}
				if (options.height.max && data.dimensions.height > options.height.max) {
					return 'dimensions';
				}
			}
		}
		
		if (options.format) {
			if (typeof options.format === 'string') {
				if (data.format !== options.format) {
					return 'format';
				}
			}
			else {
				if (!options.format.includes(data.format)) {
					return 'format';
				}
			}
		}
		
		return true;
	}
	
	public static getImageData(image: Buffer | string): ImageData | null {
		const imageBuffer = typeof image === 'string' ? Buffer.from(image, 'base64') : image;
		const dimensions = imageSize(imageBuffer);
		
		if (!dimensions || !dimensions.width || !dimensions.height || !dimensions.type) {
			return null;
		}
		return {
			dimensions: {
				width: dimensions.width,
				height: dimensions.height,
			},
			format: dimensions.type,
		};
	}
}

export default ImageUtils;
