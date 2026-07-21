import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { AppError } from '../utils/response.js';

const configure = () => {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError(503, 'Receipt storage is not configured');
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

export const uploadReceipt = async (
  buffer: Buffer,
  userId: string,
  transactionId: string,
) => {
  configure();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_UPLOAD_FOLDER}/${userId}`,
        public_id: transactionId,
        overwrite: true,
        resource_type: 'image',
        type: 'authenticated',
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(502, 'Receipt upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

export const deleteReceipt = async (publicId: string) => {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    return;
  }
  configure();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    invalidate: true,
  });
};
