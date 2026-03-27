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

module.exports = { uploadImage }
