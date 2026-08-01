const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/box-status', sensorController.getBoxStatus);
router.post('/box-status', sensorController.postBoxStatus);

module.exports = router;
