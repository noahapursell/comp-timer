import React, { useEffect, useState } from "react";
import TimerComponent from "./TimerComponent";
import io from "socket.io-client";
import "./App.css";
// For production, simply use io().
// For development, you might need: const socket = io('http://localhost:3001');

let BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
if (BACKEND_URL && window.location.protocol === "https:" && BACKEND_URL.startsWith("http://")) {
  BACKEND_URL = BACKEND_URL.replace("http://", "https://");
}
const socket = BACKEND_URL ? io(BACKEND_URL) : io();

function App() {
  console.log("Connecting to backend at:", BACKEND_URL);
  const [timers, setTimers] = useState({});
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Listen for state updates from the backend.
    socket.on("stateUpdate", (state) => {
      setTimers(state);
    });
    return () => {
      socket.off("stateUpdate");
    };
  }, []);

  return (
    <div className={`App ${darkMode ? "dark" : "light"}`}>
      <header className="App-header">
        <h1>Timers Dashboard</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="dark-mode-toggle"
        >
          {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
      </header>
      <div className="timers-grid">
        {Object.entries(timers).map(([timerId, timerData]) => (
          <TimerComponent
            key={timerId}
            timerId={timerId}
            timerData={timerData}
            socket={socket}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
