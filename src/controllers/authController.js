const authService = require('../services/authService');
const { ValidationError } = require('../utils/errors');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.resetPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyResetToken(req, res, next) {
    try {
      const { token } = req.params;
      const result = await authService.verifyResetToken(token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async setNewPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      const result = await authService.setNewPassword(token, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController(); 