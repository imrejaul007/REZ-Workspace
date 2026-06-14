import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import crypto from 'crypto';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import { fileTypeFromBuffer } from 'file-type';

const router = Router();
router.use(merchantAuth);

// Configure multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm',
  'application/pdf',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
  'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/x-msvideo': '.avi',
  'video/x-ms-wmv': '.wmv', 'video/webm': '.webm', 'application/pdf': '.pdf',
};

const fileFilter = async (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mov', '.avi', '.wmv', '.webm'];

  if (!allowedExt.includes(ext)) {
    return cb(new Error('Invalid file type'));
  }

  // MAGIC BYTE VALIDATION: Read the first 261 bytes (max header size for file-type)
  // to detect the actual file type. This prevents polyglot attacks where a malicious
  // file (e.g. .jpg containing embedded PHP code) passes extension and MIME checks.
  // The buffer is read synchronously from the multer temp file before multer deletes it.
  const fileHeader = Buffer.alloc(261);
  let fd: number | null = null;
  try {
    fd = fs.openSync(file.path, 'r');
    fs.readSync(fd, fileHeader, 0, 261, 0);
  } catch {
    fs.unlinkSync(file.path);
    return cb(new Error('Failed to read file for validation'));
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }

  const detected = await fileTypeFromBuffer(fileHeader);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    fs.unlinkSync(file.path);
    return cb(new Error('File content does not match declared type'));
  }

  // Ensure declared MIME matches detected MIME
  if (detected.mime !== file.mimetype) {
    logger.warn('MIME mismatch — declared vs detected', {
      declared: file.mimetype,
      detected: detected.mime,
      file: file.originalname,
    });
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// Cloudinary upload helper
async function uploadToCloudinary(filePath: string, folder: string): Promise<unknown> {
  try {
    const cloudinary = await import('cloudinary');
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const result = await cloudinary.v2.uploader.upload(filePath, { folder, quality: 'auto', resource_type: 'auto' });
    // Clean up temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return result;
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw err;
  }
}

// POST /uploads/product-image
router.post('/product-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const folder = `merchants/${req.merchantId}/products`;
    const result = await uploadToCloudinary(req.file.path, folder);
    res.json({ success: true, message: 'Image uploaded', data: { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, format: result.format } });
  } catch (err: unknown) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /uploads/product-images (multiple)
router.post('/product-images', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) { res.status(400).json({ success: false, message: 'No files uploaded' }); return; }
    const folder = `merchants/${req.merchantId}/products`;
    const results: Array<{ url: string; publicId: string; width: number; height: number; format: string }> = [];
    for (const file of files) {
      const r = await uploadToCloudinary(file.path, folder);
      results.push({ url: r.secure_url, publicId: r.public_id, width: r.width, height: r.height, format: r.format });
    }
    res.json({ success: true, message: `${results.length} images uploaded`, data: { images: results } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /uploads/image
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const folder = `merchants/${req.merchantId}/uploads`;
    const result = await uploadToCloudinary(req.file.path, folder);
    res.json({ success: true, message: 'Image uploaded', data: { url: result.secure_url, publicId: result.public_id, filename: req.file.originalname, size: req.file.size } });
  } catch (err: unknown) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /uploads/images (alias)
router.post('/images', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const folder = `merchants/${req.merchantId}/uploads`;
    const result = await uploadToCloudinary(req.file.path, folder);
    res.json({ success: true, message: 'Image uploaded', data: { url: result.secure_url, publicId: result.public_id } });
  } catch (err: unknown) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /uploads/store-logo
router.post('/store-logo', upload.single('logo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const folder = `merchants/${req.merchantId}/logos`;
    const result = await uploadToCloudinary(req.file.path, folder);
    res.json({ success: true, message: 'Logo uploaded', data: { url: result.secure_url, publicId: result.public_id } });
  } catch (err: unknown) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /uploads/store-banner
router.post('/store-banner', upload.single('banner'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const folder = `merchants/${req.merchantId}/banners`;
    const result = await uploadToCloudinary(req.file.path, folder);
    res.json({ success: true, message: 'Banner uploaded', data: { url: result.secure_url, publicId: result.public_id } });
  } catch (err: unknown) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /uploads/video
router.post('/video', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const folder = `merchants/${req.merchantId}/videos`;
    const result = await uploadToCloudinary(req.file.path, folder);
    res.json({ success: true, message: 'Video uploaded', data: { url: result.secure_url, publicId: result.public_id, duration: result.duration, format: result.format } });
  } catch (err: unknown) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /uploads/:filename
router.delete('/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename as string;
    // MS-34: Verify the Cloudinary public_id belongs to this merchant's folder.
    // All uploads via this service are stored under merchants/<merchantId>/...
    // Reject any delete request targeting a different merchant's path or a raw filename
    // that doesn't carry the merchant's folder prefix.
    const expectedPrefix = `merchants/${req.merchantId}/`;
    if (!filename.startsWith(expectedPrefix)) {
      res.status(403).json({ success: false, message: 'Access denied: file does not belong to your account' });
      return;
    }
    const cloudinary = await import('cloudinary');
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await cloudinary.v2.uploader.destroy(filename);
    res.json({ success: true, message: 'File deleted' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
