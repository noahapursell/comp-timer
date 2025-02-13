import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function Timer() {
  // Timer metadata state
  const [name, setName] = useState('Timer Name');
  const [task, setTask] = useState('Task Name');

  // Timer functionality state (minutes and seconds input)
  const [inputMinutes, setInputMinutes] = useState(10);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [totalDuration, setTotalDuration] = useState(10 * 60); // in seconds
  const [remainingTime, setRemainingTime] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Flashing state: flashActive toggles to show flash; hasFlashed means flashing is done.
  const [flashActive, setFlashActive] = useState(false);
  const [hasFlashed, setHasFlashed] = useState(false);
  const flashingStartedRef = useRef(false); // ensures flashing is started only once

  // Control modal popup for metadata editing
  const [showModal, setShowModal] = useState(false);

  // Start or resume the timer countdown
  useEffect(() => {
    if (isRunning && remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, remainingTime]);

  // Flashing effect: once remainingTime goes below 240 seconds, flash 5 times.
  useEffect(() => {
    if (remainingTime <= 240 && !hasFlashed && !flashingStartedRef.current) {
      flashingStartedRef.current = true;
      startFlashing(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingTime, hasFlashed]);

  // Recursive function to toggle flash state.
  const startFlashing = (count) => {
    if (count < 10) { // 10 toggles equals 5 full flashes.
      setFlashActive(prev => !prev);
      setTimeout(() => startFlashing(count + 1), 500);
    } else {
      setHasFlashed(true);
      setFlashActive(false);
    }
  };

  // Set the timer using both minutes and seconds inputs.
  const handleSetTimer = () => {
    const minutes = parseInt(inputMinutes, 10) || 0;
    const seconds = parseInt(inputSeconds, 10) || 0;
    const totalSec = minutes * 60 + seconds;
    setTotalDuration(totalSec);
    setRemainingTime(totalSec);
    setIsRunning(false);
    clearInterval(intervalRef.current);
    // Reset flash state if new total time is above 4 minutes.
    if (totalSec > 240) {
      setHasFlashed(false);
      flashingStartedRef.current = false;
    }
  };

  const handleStart = () => {
    if (remainingTime > 0) {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  // Format seconds into mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate progress for the circular clock.
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? (totalDuration - remainingTime) / totalDuration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className={`timer ${flashActive ? 'flash' : ''} ${hasFlashed ? 'alert' : ''}`}>
      {/* Header: Displays title as "Name: Task" with an edit icon */}
      <div className="timer-header">
        <div className="timer-name">{name}: {task}</div>
        <button className="edit-icon" onClick={() => setShowModal(true)}>
          ✏️
        </button>
      </div>

      {/* Timer Display: Large time digits and circular progress clock */}
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
          {/* Progress circle */}
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

      {/* Timer Controls: Compact controls for start, pause, and setting time */}
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

      {/* Modal Popup for Metadata Editing */}
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
                className="modal-input name-input"
              />
            </label>
            <label>
              Task:
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="modal-input task-input"
              />
            </label>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  // Dark mode state (toggle via header button)
  const [darkMode, setDarkMode] = useState(true);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Create 8 timers (2 rows of 4)
  const timers = Array.from({ length: 8 }, (_, index) => <Timer key={index} />);
  
  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <header className="App-header">
        <h1>Timers Dashboard</h1>
        <button onClick={toggleDarkMode} className="dark-mode-toggle">
          {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </header>
      <div className="timers-grid">{timers}</div>
    </div>
  );
}

export default App;
