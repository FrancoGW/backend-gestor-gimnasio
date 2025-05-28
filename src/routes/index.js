const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/gyms', require('./gym'));
router.use('/students', require('./student'));
router.use('/membership-plans', require('./membershipPlan'));
router.use('/check-ins', require('./checkIn'));
router.use('/analytics', require('./analytics'));

module.exports = router; 