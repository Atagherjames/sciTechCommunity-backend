import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dx0ll70so',
  api_key: process.env.CLOUDINARY_API_KEY || '637354963884816',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'eDLWWMKjeC3szRXtFn1Z9aS5v4s',
  secure: true,
});

export const uploadFileToCloudinary = async (
  filePath: string,
  folder = 'scitech-community'
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return '';
  }
};

export { cloudinary };
