const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const authService = require('../services/authService');
const { ValidationError } = require('../utils/errors');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, phone, gymId } = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado',
          code: 'EMAIL_EXISTS'
        });
      }

      // Crear nuevo usuario
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        gymId
      });

      await user.save();

      // Generar token JWT
      const token = jwt.sign(
        { userId: user._id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            gymId: user.gymId
          },
          token
        },
        message: 'Usuario registrado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verificar contraseña
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo',
          code: 'USER_INACTIVE'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { userId: user._id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            gymId: user.gymId
          },
          token
        },
        message: 'Inicio de sesión exitoso'
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await User.findById(req.user._id).select('-password');
      
      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      // Verificar contraseña actual
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta',
          code: 'INVALID_PASSWORD'
        });
      }

      // Actualizar contraseña
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
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