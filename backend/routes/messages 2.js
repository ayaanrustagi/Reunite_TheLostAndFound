const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/', messageController.getMyMessages);
router.post('/', messageController.createMessage);

module.exports = router;
