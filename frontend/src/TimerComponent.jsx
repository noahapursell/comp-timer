import React, { useState, useEffect, useRef } from 'react';
import './TimerComponent.css';

function TimerComponent({ timerId, timerData, socket }) {
  // Timer properties
  const [name, setName] = useState(timerData.name);
  const [task, setTask] = useState(timerData.task);
  const [inputMinutes, setInputMinutes] = useState(Math.floor(timerData.totalDuration / 60));
  const [inputSeconds, setInputSeconds] = useState(timerData.totalDuration % 60);
  const [totalDuration, setTotalDuration] = useState(timerData.totalDuration);
  const [remainingTime, setRemainingTime] = useState(timerData.remaining);
  const [isRunning, setIsRunning] = useState(timerData.isRunning);
  const [showModal, setShowModal] = useState(false);

  // Flashing state for when remaining time falls below 4 minutes (240 seconds)
  const [flashActive, setFlashActive] = useState(false);
  const [hasFlashed, setHasFlashed] = useState(false);
  const flashStartedRef = useRef(false);

  // Update local state when backend state changes.
  useEffect(() => {
    setName(timerData.name);
    setTask(timerData.task);
    setTotalDuration(timerData.totalDuration);
    setRemainingTime(timerData.remaining);
    setIsRunning(timerData.isRunning);
  }, [timerData]);

  // Start flashing when remaining time drops below 240 seconds.
  useEffect(() => {
    if (remainingTime <= 240 && !hasFlashed && !flashStartedRef.current) {
      flashStartedRef.current = true;
      startFlashing(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingTime]);

  // Recursive flashing function (10 toggles = 5 full flashes).
  const startFlashing = (count) => {
    if (count < 10) {
      setFlashActive(prev => !prev);
      setTimeout(() => startFlashing(count + 1), 500);
    } else {
      setHasFlashed(true);
      setFlashActive(false);
    }
  };

  // Function to send updated timer data to the backend.
  const updateServer = (updatedFields) => {
    const updatedTimerData = {
      name,
      task,
      totalDuration,
      remaining: remainingTime,
      isRunning,
      ...updatedFields
    };
    socket.emit('updateTimer', { timerId, timerData: updatedTimerData });
  };

  // Handlers for controls.
  const handleSetTimer = () => {
    const minutes = parseInt(inputMinutes, 10) || 0;
    const seconds = parseInt(inputSeconds, 10) || 0;
    const totalSec = minutes * 60 + seconds;
    setTotalDuration(totalSec);
    setRemainingTime(totalSec);
    setIsRunning(false);
    updateServer({ totalDuration: totalSec, remaining: totalSec, isRunning: false });
    // Reset flashing if new total time is above 4 minutes.
    if (totalSec > 240) {
      setHasFlashed(false);
      setFlashActive(false);
      flashStartedRef.current = false;
    }
  };

  const handleStart = () => {
    if (remainingTime > 0) {
      setIsRunning(true);
      updateServer({ isRunning: true });
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    updateServer({ isRunning: false });
  };

  // Helper function to format seconds as mm:ss.
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate circular progress parameters.
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? (totalDuration - remainingTime) / totalDuration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className={`timer ${remainingTime <= 240 ? (flashActive ? 'flash' : (hasFlashed ? 'alert' : '')) : ''}`}>
      <div className="timer-header">
        <div className="timer-name">{name}: {task}</div>
        <button className="edit-icon" onClick={() => setShowModal(true)}>✏️</button>
      </div>

      <div className="timer-display">
        <div className="time-digits">{formatTime(remainingTime)}</div>
        <svg width="120" height="120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#ccc"
            strokeWidth="10"
            fill="none"
          />
          {/* Red progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="red"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
          />
        </svg>
      </div>

      <div className="timer-controls">
        <button onClick={handleStart}>Start</button>
        <button onClick={handlePause}>Pause</button>
        <label>
          M:
          <input
            type="number"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            className="time-input"
          />
        </label>
        <label>
          S:
          <input
            type="number"
            value={inputSeconds}
            onChange={(e) => setInputSeconds(e.target.value)}
            className="time-input"
          />
        </label>
        <button onClick={handleSetTimer}>Set</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Timer Metadata</h2>
            <label>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="modal-input"
              />
            </label>
            <label>
              Task:
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="modal-input"
              />
            </label>
            <button
              onClick={() => {
                updateServer({ name, task });
                setShowModal(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimerComponent;
