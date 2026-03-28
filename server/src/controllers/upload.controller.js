const cloudinary = require('../config/cloudinary')
const { success, error } = require('../utils/response')

// POST /upload/image
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No image file provided', 400)
    }

    return success(res, {
      url: req.file.path,
      publicId: req.file.filename
    }, 'Image uploaded')
  } catch (err) {
    next(err)
  }
}

// DELETE /upload/image
const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body
    if (!publicId) {
      return error(res, 'publicId is required', 400)
    }

    await cloudinary.uploader.destroy(publicId)
    return success(res, null, 'Image deleted')
  } catch (err) {
    next(err)
  }
}

module.exports = { uploadImage, deleteImage }
