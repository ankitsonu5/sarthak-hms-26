const express = require('express');
const router = express.Router();
const masterController = require('./master.controller');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const depRoutes = require('./patient_master_dependencies.routes');

const ADMIN_LEVEL = [R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.use('/dependencies', depRoutes);

router.get('/registration-dependencies', masterController.getRegistrationMasters);
router.get('/:tableName', masterController.getAll);
router.get('/:tableName/:id', masterController.getById);

router.post('/:tableName', authorize(...ADMIN_LEVEL), masterController.create);
router.put('/:tableName/:id', authorize(...ADMIN_LEVEL), masterController.update);
router.delete('/:tableName/:id', authorize(...ADMIN_LEVEL), masterController.delete);

module.exports = router;
