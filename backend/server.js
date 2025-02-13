const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Enable CORS for Socket.io so that clients on different ports can connect.
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory "ground truth" for timers.
let timerState = {
  timer1: {
    name: "Timer 1",
    task: "Task A",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
  timer2: {
    name: "Timer 2",
    task: "Task B",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
  timer3: {
    name: "Timer 3",
    task: "Task C",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
  timer4: {
    name: "Timer 4",
    task: "Task D",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
  timer5: {
    name: "Timer 5",
    task: "Task E",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
  timer6: {
    name: "Timer 6",
    task: "Task F",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
  timer7: {
    name: "Timer 7",
    task: "Task G",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
  timer8: {
    name: "Timer 8",
    task: "Task H",
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  },
};

// Serve static files from the React build folder.
app.use(express.static(path.join(__dirname, "build")));

// Handle socket connections.
io.on("connection", (socket) => {
  console.log("New client connected");

  // Send current timer state when a client connects.
  socket.emit("stateUpdate", timerState);

  // Listen for timer command updates from clients.
  socket.on("updateTimer", (data) => {
    const { timerId, timerData } = data;
    timerState[timerId] = { ...timerState[timerId], ...timerData };
    io.emit("stateUpdate", timerState);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Global tick loop: runs every second.
setInterval(() => {
  let stateChanged = false;
  Object.keys(timerState).forEach((id) => {
    const timer = timerState[id];
    if (timer.isRunning && timer.remaining > 0) {
      timer.remaining -= 1;
      // If timer reached 0, stop it.
      if (timer.remaining <= 0) {
        timer.remaining = 0;
        timer.isRunning = false;
      }
      stateChanged = true;
    }
  });
  if (stateChanged) {
    io.emit("stateUpdate", timerState);
  }
  console.log("Tick");
}, 1000);

// Fallback: serve index.html for any unknown route.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
