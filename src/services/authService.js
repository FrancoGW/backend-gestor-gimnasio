const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { UnauthorizedError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthService {
  async register(userData) {
    try {
      // Verificar si el email ya está registrado
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new ValidationError('El email ya está registrado');
      }

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Crear usuario
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      logger.info(`Usuario registrado: ${user.email}`);

      // Generar token
      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      logger.error('Error en registro:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Buscar usuario
      const user = await User.findOne({ email });
      if (!user) {
        throw new UnauthorizedError('Credenciales inválidas');
      }

      // Verificar contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('Credenciales inválidas');
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        throw new UnauthorizedError('Usuario inactivo');
      }

      // Generar token
      const token = this.generateToken(user);

      logger.info(`Usuario logueado: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      logger.error('Error en login:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new UnauthorizedError('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('Contraseña actual incorrecta');
      }

      // Encriptar nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Actualizar contraseña
      user.password = hashedPassword;
      await user.save();

      logger.info(`Contraseña actualizada para usuario: ${user.email}`);

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      logger.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new UnauthorizedError('Usuario no encontrado');
      }

      // Generar token de reseteo
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Guardar token en usuario
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
      await user.save();

      // TODO: Enviar email con link de reseteo
      logger.info(`Token de reseteo generado para usuario: ${user.email}`);

      return { message: 'Se ha enviado un email con instrucciones' };
    } catch (error) {
      logger.error('Error al resetear contraseña:', error);
      throw error;
    }
  }

  async verifyResetToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        _id: decoded.userId,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new UnauthorizedError('Token inválido o expirado');
      }

      return user;
    } catch (error) {
      logger.error('Error al verificar token de reseteo:', error);
      throw error;
    }
  }

  async setNewPassword(token, newPassword) {
    try {
      const user = await this.verifyResetToken(token);

      // Encriptar nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Actualizar contraseña y limpiar tokens
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      logger.info(`Contraseña reseteada para usuario: ${user.email}`);

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      logger.error('Error al establecer nueva contraseña:', error);
      throw error;
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        gymId: user.gymId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  sanitizeUser(user) {
    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.resetPasswordToken;
    delete sanitized.resetPasswordExpires;
    return sanitized;
  }
}

module.exports = new AuthService(); 