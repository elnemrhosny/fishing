import { Router } from 'express';
import { upload, uploadStream } from '../utils/cloudinary.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

// Single image upload (admin only)
router.post('/single', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await uploadStream(req.file.buffer, {
      mimetype: req.file.mimetype,
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

// Multiple image upload (admin only)
router.post('/multiple', requireAuth, requireAdmin, upload.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const uploadPromises = req.files.map(file =>
      uploadStream(file.buffer, { mimetype: file.mimetype })
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.secure_url);

    res.json({
      urls,
      images: results.map(r => ({ url: r.secure_url, public_id: r.public_id })),
    });
  } catch (error) {
    console.error('Multiple images upload error:', error);
    res.status(500).json({ error: 'Failed to upload images', details: error.message });
  }
});

export default router;
