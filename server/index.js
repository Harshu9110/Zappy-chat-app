const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const User = require("./models/userModel"); // Import your User model
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log(err.message);
  });

// Default route to respond with "Hello"
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hello Page</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
          }
          h1 {
            color: #333;
            font-size: 3rem;
          }
        </style>
      </head>
      <body>
        <h1>Hello Harsh!</h1>
      </body>
    </html>
  `);
});


app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);

const io = socket(server, {
  cors: {
    origin: "https://zappy-chat-app.vercel.app",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('add-user', async (userId) => {
    onlineUsers.set(userId, socket.id); // Map userId to socket.id
    socket.join(userId);
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true }); // Update user status in the database
      socket.broadcast.emit('user-status', userId, true); // Notify others of user's online status
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });

  // Handle user disconnecting
  socket.on('disconnect', async () => {
    let disconnectedUserId = null;
    onlineUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
      }
    });

    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      try {
        await User.findByIdAndUpdate(disconnectedUserId, { isOnline: false }); // Update user status in the database
        socket.broadcast.emit('user-status', disconnectedUserId, false); // Notify others of user's offline status
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }

    console.log('User disconnected:', socket.id);
  });

  // Handle sending messages
  socket.on('send-msg', (data) => {
    io.to(data.to).emit('msg-recieve', data.message);
  });

  // Handle user logout
  socket.on('logout', async (userId) => {
    onlineUsers.delete(userId);
    try {
      await User.findByIdAndUpdate(userId, { isOnline: false }); // Update user status in the database
      socket.broadcast.emit('user-status', userId, false); // Notify others of user's offline status
    } catch (error) {
      console.error('Error updating user status:', error);
    }
    socket.disconnect(); // Disconnect the socket
  });
});
