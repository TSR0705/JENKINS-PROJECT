const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');

router.get('/:id', jobController.getJobHandler);
router.get('/:id/json', jobController.getJobJsonHandler);

module.exports = router;