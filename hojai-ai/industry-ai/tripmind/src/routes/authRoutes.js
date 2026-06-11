const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { validateBody } = require('../middleware');
const { userRegisterSchema, userLoginSchema } = require('../utils/validators');
const { authenticate, authLimiter } = require('../middleware');

router.post('/register', authLimiter, validateBody(userRegisterSchema), authController.register);

router.post('/login', authLimiter, validateBody(userLoginSchema), authController.login);

router.post('/logout', authenticate, authController.logout);

router.post('/refresh', authController.refreshToken);

router.get('/profile', authenticate, authController.getProfile);

router.put('/profile', authenticate, authController.updateProfile);

router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;