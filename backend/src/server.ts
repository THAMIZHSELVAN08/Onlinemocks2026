import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import hrRoutes from "./routes/hr";
import volunteerRoutes from "./routes/volunteer";
import swaggerUi from "swagger-ui-express";
import { generateOpenAPIDocument } from "./openapi";
const openApiDocument = generateOpenAPIDocument();
import pipelineRoutes from "./routes/pipeline";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Required to serve files (resumes)
  }),
);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.set("socketio", io);

// Socket.io Events
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", (data) => {
    // Rooms can be 'hr-id' or 'student-id' or 'admin'
    socket.join(data.room);
    console.log(`User ${socket.id} joined room ${data.room}`);
  });



  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
