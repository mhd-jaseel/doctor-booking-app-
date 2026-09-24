const express = require('express');
const router = express.Router();
const waitingListController = require('../controllers/waitingList.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validateObjectId.middleware');
const { validateWaitingList } = require('../validations');

router.use(protect);

router.post('/', validateWaitingList, waitingListController.joinWaitingList);
router.get('/my', waitingListController.getMyWaitingList);
router.get('/:scheduleId', validateObjectId('scheduleId'), waitingListController.getScheduleWaitingList);

module.exports = router;
