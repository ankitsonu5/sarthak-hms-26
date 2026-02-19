const express = require('express');
const router = express.Router();
const masterController = require('./master.controller');

/**
 * MASTER DATA MANAGEMENT ROUTES
 * Base Path: /api/master
 */

// Special: Fetch all masters for Patient Registration (single call)
router.get('/registration-dependencies', masterController.getRegistrationMasters);

// Generic CRUD for all master tables
// Example: /api/master/master_gender
router.get('/:tableName', masterController.getAll);           // List All
router.get('/:tableName/:id', masterController.getById);      // Single Record
router.post('/:tableName', masterController.create);          // Create (Object or Array)
router.put('/:tableName/:id', masterController.update);       // Update
router.delete('/:tableName/:id', masterController.delete);    // Delete

module.exports = router;
