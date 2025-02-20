const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for Socket.io so that clients on different ports can connect.
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Efficiently initialize timer state using a loop.
const timerState = {};
const timerKeys = [
  "timer1",
  "timer2",
  "timer3",
  "timer4",
  "timer5",
  "timer6",
  "timer7",
  "timer8",
];
const tasks = [
  "Task A",
  "Task B",
  "Task C",
  "Task D",
  "Task E",
  "Task F",
  "Task G",
  "Task H",
];

timerKeys.forEach((key, index) => {
  timerState[key] = {
    name: `Timer ${index + 1}`,
    task: tasks[index],
    queue: "", // new field for next task
    totalDuration: 600,
    remaining: 600,
    isRunning: false,
  };
});

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

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
