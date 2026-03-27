const express = require('express')
const router = express.Router()

const auth = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')
const { uploadImage } = require('../controllers/upload.controller')

router.post('/image', auth, upload.single('image'), uploadImage)

module.exports = router
