const express = require('express');
const router = express.Router();
const masterController = require('./master.controller');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const ADMIN = [R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.get('/registration-dependencies', masterController.getRegistrationMasters);
router.get('/:tableName', masterController.getAll);
router.get('/:tableName/:id', masterController.getById);
router.post('/:tableName', authorize(...ADMIN), masterController.create);
router.put('/:tableName/:id', authorize(...ADMIN), masterController.update);
router.delete('/:tableName/:id', authorize(...ADMIN), masterController.delete);

module.exports = router;
