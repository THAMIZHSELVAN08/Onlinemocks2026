"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const socket_io_1 = require("socket.io");
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const hr_1 = __importDefault(require("./routes/hr"));
const volunteer_1 = __importDefault(require("./routes/volunteer"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openapi_1 = require("./openapi");
const openApiDocument = (0, openapi_1.generateOpenAPIDocument)();
const pipeline_1 = __importDefault(require("./routes/pipeline"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Required to serve files (resumes)
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static("uploads"));
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
app.use("/api/auth", auth_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/hr", hr_1.default);
app.use("/api/volunteer", volunteer_1.default);
app.use("/api/pipeline", pipeline_1.default);
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiDocument));
app.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
});
// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
