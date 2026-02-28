const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const router = express.Router();

// Import middleware and utilities
const { authenticateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { prisma } = require('../config/database');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  }
});

// All user routes require authentication
router.use(authenticateToken);

// Upload profile picture
router.post('/profile-picture', upload.single('profilePicture'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const userId = req.user.id;
  
  try {
    // Get current user to check if they have an existing profile picture
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true }
    });

    // Delete old profile picture from Cloudinary if it exists
    if (currentUser?.profilePicture) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = currentUser.profilePicture.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const publicId = `astu-profiles/${fileName.split('.')[0]}`;
        await deleteImage(publicId);
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new profile picture to Cloudinary
    const buffer = req.file.buffer;
    const tempFilePath = `/tmp/temp-${Date.now()}-${req.file.originalname}`;
    
    // Write buffer to temporary file
    const fs = require('fs');
    fs.writeFileSync(tempFilePath, buffer);

    // Upload to Cloudinary with profile-specific settings
    const uploadResult = await uploadImage(tempFilePath, 'astu-profiles');
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    // Update user's profile picture in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: uploadResult.url },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profilePicture: true,
        phone: true,
        status: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        user: updatedUser,
        profilePicture: uploadResult.url
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
}));

// Remove profile picture
router.delete('/profile-picture', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true }
    });

    if (!currentUser?.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to remove'
      });
    }

    // Delete profile picture from Cloudinary
    try {
      const urlParts = currentUser.profilePicture.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const publicId = `astu-profiles/${fileName.split('.')[0]}`;
      await deleteImage(publicId);
    } catch (deleteError) {
      console.error('Error deleting profile picture:', deleteError);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Remove profile picture URL from database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profilePicture: true,
        phone: true,
        status: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Profile picture removal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove profile picture'
    });
  }
}));

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profilePicture: true,
        phone: true,
        status: true,
        createdAt: true,
        staffDepartment: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
}));

module.exports = router;
