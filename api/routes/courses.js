'use strict';
const express = require('express');
const router = express.Router();
const { Course, User } = require('../models');
const { authenticateUser } = require('../middleware/auth-user');
const { asyncHandler } = require('../middleware/async-handler');

// GET /api/courses  → return all courses
router.get('/', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: {
      model: User,
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
    }
  });
  res.json(courses);
}));

// GET /api/courses/:id  → return a specific course
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: {
      model: User,
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
    }
  });
  if (course) {
    res.json(course);
  } else {
    res.status(404).json({ error: "Course not found." });
  }
}));

// POST /api/courses  → create a new course
router.post('/', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const newCourse = await Course.create(req.body);
    res.status(201).location(`/api/courses/${newCourse.id}`).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

// PUT /api/courses/:id → update a course
router.put('/:id', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;
  const course = await Course.findByPk(req.params.id);
  if (course) {
    if (course.userId === user.id) {
      await course.update(req.body);
      res.status(204).end();
    } else {
      res.status(403).json({ error: 'You are not authorized to update this course.' });
    }
  } else {
    res.status(404).json({ error: 'Course not found.' });
  }
}));

// DELETE /api/courses/:id → delete a course
router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;
  const course = await Course.findByPk(req.params.id);
  if (course) {
    if (course.userId === user.id) {
      await course.destroy();
      res.status(204).end();
    } else {
      res.status(403).json({ error: 'You are not authorized to delete this course.' });
    }
  } else {
    res.status(404).json({ error: 'Course not found.' });
  }
}));

module.exports = router;
