const studentService = require('../services/studentService');

class StudentController {
  async createStudent(req, res, next) {
    try {
      const student = await studentService.createStudent(req.body);
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  }

  async updateStudent(req, res, next) {
    try {
      const { id } = req.params;
      const student = await studentService.updateStudent(id, req.body);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }

  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;
      const result = await studentService.deleteStudent(id);
      res.json(result);
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
}

module.exports = new StudentController(); 