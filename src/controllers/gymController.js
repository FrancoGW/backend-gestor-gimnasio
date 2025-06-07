const gymService = require('../services/gymService');
const Gym = require('../models/Gym');
const User = require('../models/User');

class GymController {
  async createGym(req, res, next) {
    try {
      const { name, address, phone, email, ownerId, settings } = req.body;

      // Verificar si el owner existe y es un gym_owner
      const owner = await User.findOne({ _id: ownerId, role: 'gym_owner' });
      if (!owner) {
        return res.status(400).json({
          success: false,
          message: 'El propietario no existe o no tiene el rol correcto',
          code: 'INVALID_OWNER'
        });
      }

      // Crear gimnasio
      const gym = new Gym({
        name,
        address,
        phone,
        email,
        ownerId,
        settings
      });

      await gym.save();

      // Actualizar gymId del owner
      owner.gymId = gym._id;
      await owner.save();

      res.status(201).json({
        success: true,
        data: {
          gym
        },
        message: 'Gimnasio creado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGym(req, res, next) {
    try {
      const { name, address, phone, email, settings } = req.body;
      const gym = await Gym.findById(req.params.id);

      if (!gym) {
        return res.status(404).json({
          success: false,
          message: 'Gimnasio no encontrado',
          code: 'GYM_NOT_FOUND'
        });
      }

      // Actualizar campos
      gym.name = name || gym.name;
      gym.address = address || gym.address;
      gym.phone = phone || gym.phone;
      gym.email = email || gym.email;
      gym.settings = { ...gym.settings, ...settings };

      await gym.save();

      res.json({
        success: true,
        data: {
          gym
        },
        message: 'Gimnasio actualizado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteGym(req, res, next) {
    try {
      const gym = await Gym.findById(req.params.id);

      if (!gym) {
        return res.status(404).json({
          success: false,
          message: 'Gimnasio no encontrado',
          code: 'GYM_NOT_FOUND'
        });
      }

      // Desactivar gimnasio en lugar de eliminarlo
      gym.isActive = false;
      await gym.save();

      res.json({
        success: true,
        message: 'Gimnasio desactivado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async getGym(req, res, next) {
    try {
      const { id } = req.params;
      const gym = await gymService.getGym(id);
      res.json(gym);
    } catch (error) {
      next(error);
    }
  }

  async listGyms(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await gymService.listGyms(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateGymPlan(req, res, next) {
    try {
      const { id } = req.params;
      const { planId } = req.body;
      const gym = await gymService.updateGymPlan(id, planId);
      res.json(gym);
    } catch (error) {
      next(error);
    }
  }

  async getGymStats(req, res, next) {
    try {
      const gym = await Gym.findById(req.params.id);

      if (!gym) {
        return res.status(404).json({
          success: false,
          message: 'Gimnasio no encontrado',
          code: 'GYM_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          stats: gym.stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async validateGymLimits(req, res, next) {
    try {
      const { id } = req.params;
      const limits = await gymService.validateGymLimits(id);
      res.json(limits);
    } catch (error) {
      next(error);
    }
  }

  async getAllGyms(req, res, next) {
    try {
      const gyms = await Gym.find()
        .populate('ownerId', 'firstName lastName email')
        .sort('-createdAt');

      res.json({
        success: true,
        data: {
          gyms
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getGymById(req, res, next) {
    try {
      const gym = await Gym.findById(req.params.id)
        .populate('ownerId', 'firstName lastName email');

      if (!gym) {
        return res.status(404).json({
          success: false,
          message: 'Gimnasio no encontrado',
          code: 'GYM_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          gym
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GymController(); 