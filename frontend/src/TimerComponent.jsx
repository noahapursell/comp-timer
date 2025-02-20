import React, { useState, useEffect, useRef } from 'react';
import './TimerComponent.css';

function TimerComponent({ timerId, timerData, socket }) {
  // Timer properties for display (kept in sync with the backend)
  const [name, setName] = useState(timerData.name);
  const [task, setTask] = useState(timerData.task);
  const [queue, setQueue] = useState(timerData.queue || "");
  const [inputMinutes, setInputMinutes] = useState(Math.floor(timerData.totalDuration / 60));
  const [inputSeconds, setInputSeconds] = useState(timerData.totalDuration % 60);
  const [totalDuration, setTotalDuration] = useState(timerData.totalDuration);
  const [remainingTime, setRemainingTime] = useState(timerData.remaining);
  const [isRunning, setIsRunning] = useState(timerData.isRunning);

  // Modal open state
  const [showModal, setShowModal] = useState(false);

  // Flashing state – using a single flashActive flag for toggling
  const [flashActive, setFlashActive] = useState(false);
  // Separate flags to ensure each threshold only triggers once.
  const [hasFlashedAt5, setHasFlashedAt5] = useState(false);
  const [hasFlashedAt4, setHasFlashedAt4] = useState(false);
  const flashStartedAt5Ref = useRef(false);
  const flashStartedAt4Ref = useRef(false);

  // Update local state from the backend when the modal is closed.
  useEffect(() => {
    if (!showModal) {
      setName(timerData.name);
      setTask(timerData.task);
      setQueue(timerData.queue || "");
    }
    setTotalDuration(timerData.totalDuration);
    setRemainingTime(timerData.remaining);
    setIsRunning(timerData.isRunning);
  }, [timerData, showModal]);

  // Start flashing sequences when thresholds are crossed.
  useEffect(() => {
    if (remainingTime <= 300 && !hasFlashedAt5 && !flashStartedAt5Ref.current) {
      flashStartedAt5Ref.current = true;
      startFlashingAt5(0);
    }
    if (remainingTime <= 240 && !hasFlashedAt4 && !flashStartedAt4Ref.current) {
      flashStartedAt4Ref.current = true;
      startFlashingAt4(0);
    }
  }, [remainingTime]);

  // Recursive flashing function for 5 minutes (10 toggles = 5 full flashes).
  const startFlashingAt5 = (count) => {
    if (count < 10) {
      setFlashActive(prev => !prev);
      setTimeout(() => startFlashingAt5(count + 1), 500);
    } else {
      setHasFlashedAt5(true);
      setFlashActive(false);
    }
  };

  // Recursive flashing function for 4 minutes.
  const startFlashingAt4 = (count) => {
    if (count < 10) {
      setFlashActive(prev => !prev);
      setTimeout(() => startFlashingAt4(count + 1), 500);
    } else {
      setHasFlashedAt4(true);
      setFlashActive(false);
    }
  };

  // Function to send updated timer data to the backend.
  const updateServer = (updatedFields) => {
    const updatedTimerData = {
      name,
      task,
      queue,
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
    // Reset flashing if new total time is above thresholds.
    if (totalSec > 300) {
      setHasFlashedAt5(false);
      flashStartedAt5Ref.current = false;
    }
    if (totalSec > 240) {
      setHasFlashedAt4(false);
      flashStartedAt4Ref.current = false;
    }
    setFlashActive(false);
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
    <div className={`timer ${ flashActive ? 'flash' : ((hasFlashedAt5 || hasFlashedAt4) ? 'alert' : '') }`}>
      <div className="timer-header">
        <div className="header-left">
          <div className="timer-name">{name}</div>
          <div className="task">{task}</div>
          {queue && <div className="queue">Next: {queue}</div>}
        </div>
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
        <label>
          M:
          <input
            type="number"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            className="time-input"
          />
        </label>
        <button onClick={handleSetTimer}>Set</button>
        <button className="start-button" onClick={handleStart}>Start</button>
        <button className="pause-button" onClick={handlePause}>Pause</button>
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
            <label>
              Next Task (Queue):
              <input
                type="text"
                value={queue}
                onChange={(e) => setQueue(e.target.value)}
                className="modal-input"
              />
            </label>
            <button
              onClick={() => {
                updateServer({ name, task, queue });
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
