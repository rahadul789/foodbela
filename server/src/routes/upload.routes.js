const express = require('express')
const router = express.Router()

const auth = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')
const { uploadImage, deleteImage } = require('../controllers/upload.controller')

router.post('/image', auth, upload.single('image'), uploadImage)
router.delete('/image', auth, deleteImage)

module.exports = router
