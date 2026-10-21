import express from "express";
import "dotenv/config";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import {
  createRoom,
  getRoom,
  characterAddition,
} from "./rooms/roomManager.js";

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL;

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

  socket.on("character_select", (data, acknowledge) => {
    try {
      if (!data?.roomID || !data?.selectedCharacterId) {
        if (typeof acknowledge === "function") {
          return acknowledge({
            error: "Failed to receive character data",
          });
        }
        return;
      }

      // Ensure socket is joined to the room
      socket.join(data.roomID);

      const playerKey = data.player || socket.id;
      const result = characterAddition({
        roomID: data.roomID,
        player: playerKey,
        selectedCharacterId: data.selectedCharacterId,
      });

      if (!result.success) {
        if (typeof acknowledge === "function") {
          return acknowledge({
            error: result.error,
          });
        }
        return;
      }

      const room = getRoom(data.roomID);
      const selectedCount = Object.keys(room?.selectedCharacters || {}).length;

      if (selectedCount >= 2 && room) {
        room.status = "playing";
        io.to(data.roomID).emit("char_selected", {
          message: "both_char_selec_success",
          characters: room.selectedCharacters,
        });
      }

      if (typeof acknowledge === "function") {
        acknowledge({
          message: "Character added to room, waiting for opponent...",
        });
      }
    } catch (error) {
      console.error(error);
      if (typeof acknowledge === "function") {
        acknowledge({
          error: "Character selection error",
        });
      }
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
