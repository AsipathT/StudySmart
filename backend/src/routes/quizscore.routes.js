const express = require('express');
const router = express.Router();
const { QuizScore } = require('../models');

// Get all quiz scores
router.get('/', async (req, res) => {
  try {
    const { studentId, subject } = req.query;
    const where = {};
    
    if (studentId) where.studentId = studentId;
    if (subject) where.subject = subject;

    const quizScores = await QuizScore.findAll({
      where,
      order: [['date', 'DESC']]
    });

    res.json(quizScores);
  } catch (error) {
    console.error('Error fetching quiz scores:', error);
    res.status(500).json({ error: 'Failed to fetch quiz scores' });
  }
});

// Get quiz scores by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const quizScores = await QuizScore.findAll({
      where: { studentId },
      order: [['date', 'DESC']]
    });

    res.json(quizScores);
  } catch (error) {
    console.error('Error fetching student quiz scores:', error);
    res.status(500).json({ error: 'Failed to fetch student quiz scores' });
  }
});

// Create a new quiz score
router.post('/', async (req, res) => {
  try {
    const { studentId, subject, score, type, sourceFile, extractedData } = req.body;

    if (!studentId || !subject || score === undefined || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quizScore = await QuizScore.create({
      studentId,
      subject,
      score,
      type,
      sourceFile,
      extractedData
    });

    res.status(201).json(quizScore);
  } catch (error) {
    console.error('Error creating quiz score:', error);
    res.status(500).json({ error: 'Failed to create quiz score' });
  }
});

// Update a quiz score
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score, subject, type } = req.body;

    const quizScore = await QuizScore.findByPk(id);

    if (!quizScore) {
      return res.status(404).json({ error: 'Quiz score not found' });
    }

    await quizScore.update({
      score: score !== undefined ? score : quizScore.score,
      subject: subject || quizScore.subject,
      type: type || quizScore.type
    });

    res.json(quizScore);
  } catch (error) {
    console.error('Error updating quiz score:', error);
    res.status(500).json({ error: 'Failed to update quiz score' });
  }
});

// Delete a quiz score
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const quizScore = await QuizScore.findByPk(id);

    if (!quizScore) {
      return res.status(404).json({ error: 'Quiz score not found' });
    }

    await quizScore.destroy();

    res.json({ message: 'Quiz score deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz score:', error);
    res.status(500).json({ error: 'Failed to delete quiz score' });
  }
});

module.exports = router;
