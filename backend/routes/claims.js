const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');

router.get('/', claimController.getAllClaims);
router.post('/', claimController.upsertClaim);
router.delete('/:id', claimController.deleteClaim);

module.exports = router;
   