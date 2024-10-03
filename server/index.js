const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const User = require("./models/userModel"); // Import your User model
const app = express();
const socket = require("socket.io");
require("dotenv").config();

// CORS setup: Allowing only Vercel frontend
app.use(cors({
  origin: "https://zappy-chat-app.vercel.app",  // Allow only this origin
  methods: ["GET", "POST", "PUT", "DELETE"],    // Specify allowed HTTP methods
  credentials: true                             // Allow credentials (e.g., cookies or authorization headers)
}));

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
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #f65593, #2ee4ea);
            font-family: 'Arial', sans-serif;
            color: #fff;
            text-align: center;
          }
          h1 {
            font-size: 3.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            animation: fadeIn 1.5s ease-in-out;
          }
          h1 span {
            display: block;
            font-size: 1.2rem;
            margin-top: 1rem;
            font-weight: 300;
            opacity: 0.8;
          }
          @keyframes fadeIn {
            0% {
              opacity: 0;
              transform: translateY(-20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @media (max-width: 768px) {
            h1 {
              font-size: 2.5rem;
            }
            h1 span {
              font-size: 1rem;
            }
          }
        </style>
      </head>
      <body>
        <h1>Hello Harsh!<span>This is your ZappyChatBase &#10084;&#10084;</span></h1>
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

// Socket.io setup with CORS configuration
const io = socket(server, {
  cors: {
    origin: "https://zappy-chat-app.vercel.app",  // Allow frontend origin
    methods: ["GET", "POST"],
    credentials: true                             // Allow credentials
  }
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
      console.error(`Error updating user status for userId ${userId}:`, error);
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
        console.error(`Error updating user status for userId ${disconnectedUserId}:`, error);
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
      console.error(`Error updating user status for userId ${userId}:`, error);
    }
    socket.disconnect(); // Disconnect the socket
  });
});
