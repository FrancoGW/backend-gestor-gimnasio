const checkInService = require('../services/checkInService');

class CheckInController {
  async registerCheckIn(req, res, next) {
    try {
      const checkIn = await checkInService.registerCheckIn(req.body);
      res.status(201).json(checkIn);
    } catch (error) {
      next(error);
    }
  }

  async getCheckIn(req, res, next) {
    try {
      const { id } = req.params;
      const checkIn = await checkInService.getCheckIn(id);
      res.json(checkIn);
    } catch (error) {
      next(error);
    }
  }

  async listCheckIns(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await checkInService.listCheckIns(req.user.gymId, filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStudentCheckIns(req, res, next) {
    try {
      const { studentId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const result = await checkInService.getStudentCheckIns(studentId, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCheckInStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await checkInService.getCheckInStats(
        req.user.gymId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getActiveStudents(req, res, next) {
    try {
      const students = await checkInService.getActiveStudents(req.user.gymId);
      res.json(students);
    } catch (error) {
      next(error);
    }
  }

  async getPeakHours(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const peakHours = await checkInService.getPeakHours(
        req.user.gymId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(peakHours);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CheckInController(); 