const express = require('express');
const router = express.Router();
const viewController = require('../controllers/view.controller');
const jobController = require('../controllers/job.controller');

router.get('/', viewController.renderIndex);

router.post('/', jobController.createJobHandler);

module.exports = router;