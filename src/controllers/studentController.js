const studentService = require('../services/studentService');
const Student = require('../models/Student');
const MembershipPlan = require('../models/MembershipPlan');
const Gym = require('../models/Gym');

class StudentController {
  async createStudent(req, res, next) {
    try {
      const {
        firstName,
        lastName,
        dni,
        email,
        phone,
        photo,
        membershipPlanId
      } = req.body;

      const gymId = req.user.gymId;

      // Verificar si el DNI ya existe en el gimnasio
      const existingStudent = await Student.findOne({ gymId, dni });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'El DNI ya está registrado en este gimnasio',
          code: 'DNI_EXISTS'
        });
      }

      // Verificar si el plan existe y pertenece al gimnasio
      const plan = await MembershipPlan.findOne({ _id: membershipPlanId, gymId });
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: 'Plan de membresía no encontrado',
          code: 'PLAN_NOT_FOUND'
        });
      }

      // Crear estudiante
      const student = new Student({
        gymId,
        firstName,
        lastName,
        dni,
        email,
        phone,
        photo,
        membershipPlanId,
        membershipStartDate: new Date(),
        membershipExpiryDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000) // Convertir días a milisegundos
      });

      await student.save();

      // Incrementar contador de estudiantes en el plan
      await plan.incrementStudentsCount();

      // Actualizar estadísticas del gimnasio
      await Gym.findByIdAndUpdate(gymId, {
        $inc: {
          'stats.totalStudents': 1,
          'stats.activeStudents': 1
        }
      });

      res.status(201).json({
        success: true,
        data: {
          student
        },
        message: 'Estudiante registrado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStudent(req, res, next) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        photo,
        membershipPlanId
      } = req.body;

      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (student.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este estudiante',
          code: 'ACCESS_DENIED'
        });
      }

      // Si se cambia el plan, verificar que exista y pertenezca al gimnasio
      if (membershipPlanId && membershipPlanId !== student.membershipPlanId.toString()) {
        const plan = await MembershipPlan.findOne({
          _id: membershipPlanId,
          gymId: req.user.gymId
        });

        if (!plan) {
          return res.status(400).json({
            success: false,
            message: 'Plan de membresía no encontrado',
            code: 'PLAN_NOT_FOUND'
          });
        }

        // Actualizar plan y fecha de expiración
        student.membershipPlanId = membershipPlanId;
        student.membershipStartDate = new Date();
        student.membershipExpiryDate = new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000);
        student.membershipStatus = 'active';

        // Actualizar contadores de planes
        await Promise.all([
          MembershipPlan.findByIdAndUpdate(student.membershipPlanId, { $inc: { studentsCount: -1 } }),
          plan.incrementStudentsCount()
        ]);
      }

      // Actualizar campos
      student.firstName = firstName || student.firstName;
      student.lastName = lastName || student.lastName;
      student.email = email || student.email;
      student.phone = phone || student.phone;
      student.photo = photo || student.photo;

      await student.save();

      res.json({
        success: true,
        data: {
          student
        },
        message: 'Estudiante actualizado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteStudent(req, res, next) {
    try {
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (student.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este estudiante',
          code: 'ACCESS_DENIED'
        });
      }

      // Desactivar estudiante en lugar de eliminarlo
      student.isActive = false;
      await student.save();

      // Actualizar contadores
      await Promise.all([
        MembershipPlan.findByIdAndUpdate(student.membershipPlanId, { $inc: { studentsCount: -1 } }),
        Gym.findByIdAndUpdate(student.gymId, {
          $inc: {
            'stats.totalStudents': -1,
            'stats.activeStudents': -1
          }
        })
      ]);

      res.json({
        success: true,
        message: 'Estudiante desactivado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async getStudent(req, res, next) {
    try {
      const { id } = req.params;
      const student = await studentService.getStudent(id);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }

  async listStudents(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await studentService.listStudents(req.user.gymId, filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateMembership(req, res, next) {
    try {
      const { id } = req.params;
      const student = await studentService.updateMembership(id, req.body);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req, res, next) {
    try {
      const { id } = req.params;
      const { method } = req.body;
      const checkIn = await studentService.checkIn(id, method);
      res.json(checkIn);
    } catch (error) {
      next(error);
    }
  }

  async getCheckInHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const result = await studentService.getCheckInHistory(id, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async processExpiredMemberships(req, res, next) {
    try {
      const count = await studentService.processExpiredMemberships();
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  async getAllStudents(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const gymId = req.user.gymId;

      const query = { gymId };

      // Aplicar filtros
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { dni: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        query.membershipStatus = status;
      }

      const students = await Student.find(query)
        .populate('membershipPlanId', 'name price')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Student.countDocuments(query);

      res.json({
        success: true,
        data: {
          students,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req, res, next) {
    try {
      const student = await Student.findById(req.params.id)
        .populate('membershipPlanId', 'name price duration durationType');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (student.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este estudiante',
          code: 'ACCESS_DENIED'
        });
      }

      res.json({
        success: true,
        data: {
          student
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async sendQRCard(req, res, next) {
    try {
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Verificar acceso al gimnasio
      if (student.gymId.toString() !== req.user.gymId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a este estudiante',
          code: 'ACCESS_DENIED'
        });
      }

      // TODO: Implementar envío de email con QR
      // Por ahora solo devolvemos el QR
      res.json({
        success: true,
        data: {
          qrCode: student.qrCode
        },
        message: 'QR generado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController(); 