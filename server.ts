import express from "express";
import "dotenv/config";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { createRoom, getRoom } from "./rooms/roomManager.js";

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL

app.use(
  cors({
    origin: FRONTEND_URL,
  }),
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
  },
});

// Socket.IO connection

io.on("connection", (socket) => {
  console.log("Connected to socket:", socket.id);

  socket.on("create_room", (data, acknowledge) => {
    try {
      const room = createRoom(data.player);

      // Add the creator's socket to the room
      socket.join(room.id);

      // Send the response back to the requesting client
      acknowledge({
        ok: true,
        room,
      });
    } catch (error) {
      console.error(error);

      acknowledge({
        ok: false,
        error: "Failed to create room",
      });
    }
  });

  socket.on("join_room", (data, acknowledge) => {
    try {
      const room = getRoom(data.roomId);

      if (!room) {
        return acknowledge({
          ok: false,
          error: "Room not found",
        });
      }

      if (room.status !== "waiting" || room.players.length >= 2) {
        return acknowledge({
          ok: false,
          error: "Room is full or unavailable",
        });
      }

      // Add the player to the room's application state
      room.players.push(data.player);

      // Join the Socket.IO room
      socket.join(room.id);

      acknowledge({
        ok: true,
        room,
      });

      // Notify both clients
      io.to(room.id).emit("room_update", {
        roomId: room.id,
        playerCount: room.players.length,
        status: room.status,
      });
    } catch (error) {
      console.error(error);

      acknowledge({
        ok: false,
        error: "Failed to join room",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

// Optional HTTP endpoint for checking server status
app.get("/", (req, res) => {
  res.send("Byte Battle WebSocket server is running");
});

server.listen(9000, () => {
  console.log("Socket server started on port 9000");
});
