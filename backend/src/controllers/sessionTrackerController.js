const SessionTrackerSession = require('../models/SessionTrackerSession');
const sessionTrackerService = require('../services/sessionTrackerService');

let timerState = {
  startTime: null,
  isPaused: false,
  pauseTime: null,
  elapsedPausedTime: 0,
};

// Start a new study session timer
const startTimer = (req, res) => {
  timerState = {
    startTime: new Date(),
    isPaused: false,
    pauseTime: null,
    elapsedPausedTime: 0,
  };
  res.status(200).json({ message: 'Timer started', startTime: timerState.startTime });
};

// Pause the study session timer
const pauseTimer = (req, res) => {
  if (!timerState.startTime || timerState.isPaused) {
    return res.status(400).json({ message: 'Timer not running or already paused' });
  }
  timerState.isPaused = true;
  timerState.pauseTime = new Date();
  res.status(200).json({ message: 'Timer paused' });
};

// Resume the study session timer
const resumeTimer = (req, res) => {
  if (!timerState.startTime || !timerState.isPaused) {
    return res.status(400).json({ message: 'Timer not paused or not running' });
  }
  timerState.elapsedPausedTime += new Date() - timerState.pauseTime;
  timerState.isPaused = false;
  timerState.pauseTime = null;
  res.status(200).json({ message: 'Timer resumed' });
};

// Stop the study session timer and calculate duration
const stopTimer = (req, res) => {
  if (!timerState.startTime) {
    return res.status(400).json({ message: 'Timer not running' });
  }

  let endTime = new Date();
  if (timerState.isPaused) {
    endTime = timerState.pauseTime;
  }

  const totalElapsedTime = endTime - timerState.startTime - timerState.elapsedPausedTime;
  const durationInSeconds = Math.round(totalElapsedTime / 1000);

  const sessionData = {
    duration: durationInSeconds,
    startTime: timerState.startTime,
    endTime: endTime,
  };

  timerState = {
    startTime: null,
    isPaused: false,
    pauseTime: null,
    elapsedPausedTime: 0,
  };

  res.status(200).json({ message: 'Timer stopped', sessionData });
};

// Save a new study session
const saveSession = async (req, res) => {
  const {
    userId, subject, unitName, notes, quizScore,
    startTime, endTime, duration, pomodoroMode, intervals,
    materialName, workedTime, pagesCompleted, totalPages,
  } = req.body;

  try {
    const newSession = new SessionTrackerSession({
      userId,
      subject,
      unitName,
      notes,
      quizScore,
      startTime,
      endTime,
      duration,
      pomodoroMode,
      intervals,
      materialName,
      workedTime,
      pagesCompleted,
      totalPages,
    });

    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get study session history (Filtered)
const getHistory = async (req, res) => {
  const { userId } = req.params;
  const { subject, unitName, startDate, endDate } = req.query;
  try {
    const history = await sessionTrackerService.getHistory(userId, { subject, unitName, startDate, endDate });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all study session history (Admin)
const getAllHistory = async (req, res) => {
  const { subject, unitName, userId } = req.query;
  try {
    const history = await sessionTrackerService.getAllHistory({ subject, unitName, userId });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get study session statistics
const getStats = async (req, res) => {
  const { userId } = req.params;
  try {
    const stats = await sessionTrackerService.getStats(userId);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  saveSession,
  getAllHistory,
  getHistory,
  getStats,
};
