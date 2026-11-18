const express = require('express');
const router = express.Router();
const UserController = require('../server/api/controllers/userControllers');
const authMiddleware = require("../middleware/authMiddleware");
router.use(authMiddleware);




// Endpoint ini akan menangani GET /api/users
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;