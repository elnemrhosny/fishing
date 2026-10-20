import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure Multer for in-memory uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

export async function uploadStream(buffer, options = {}) {
  // If cloudinary is configured, upload to cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'fishing-ecommerce',
          resource_type: 'auto',
          ...options,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(buffer);
    });
  }

  // Fallback if Cloudinary credentials not configured yet (e.g. local dev):
  // Convert buffer to data URI so application continues to work seamlessly!
  const mime = options.mimetype || 'image/jpeg';
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mime};base64,${base64}`;
  return {
    secure_url: dataUrl,
    public_id: 'local-' + Date.now(),
  };
}

export default cloudinary;
