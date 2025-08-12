const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'rental-management/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
        ]
    }
});

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Middleware for handling image uploads
const uploadImages = (req, res, next) => {
    const uploadMultiple = upload.array('images', 5);

    uploadMultiple(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'FILE_TOO_LARGE',
                            message: 'File size too large. Maximum size is 5MB per file.'
                        }
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'TOO_MANY_FILES',
                            message: 'Too many files. Maximum 5 files allowed.'
                        }
                    });
                }
            }

            return res.status(400).json({
                success: false,
                error: {
                    code: 'UPLOAD_ERROR',
                    message: err.message || 'File upload failed'
                }
            });
        }

        // Store uploaded file info in request
        if (req.files && req.files.length > 0) {
            req.uploadedImages = req.files;
        }

        next();
    });
};

// Middleware for single image upload
const uploadSingleImage = (req, res, next) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'FILE_TOO_LARGE',
                            message: 'File size too large. Maximum size is 5MB.'
                        }
                    });
                }
            }

            return res.status(400).json({
                success: false,
                error: {
                    code: 'UPLOAD_ERROR',
                    message: err.message || 'File upload failed'
                }
            });
        }

        // Store uploaded file info in request
        if (req.file) {
            req.uploadedImage = req.file;
        }

        next();
    });
};

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
};

// Function to delete multiple images from Cloudinary
const deleteImages = async (publicIds) => {
    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        throw error;
    }
};

module.exports = {
    uploadImages,
    uploadSingleImage,
    deleteImage,
    deleteImages,
    cloudinary
};