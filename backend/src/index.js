require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Required to serve files (resumes)
}));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.set('socketio', io);

// Socket.io Events
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (data) => {
        // Rooms can be 'hr-id' or 'student-id' or 'admin'
        socket.join(data.room);
        console.log(`User ${socket.id} joined room ${data.room}`);
    });

    // Student sends pulse during exam
    socket.on('exam_heartbeat', (data) => {
        // data: { studentId, hrId, status: 'active' | 'tab-switched', progress: 0-100 }
        io.to(data.hrId).emit('student_status_update', {
            studentId: data.studentId,
            status: data.status,
            progress: data.progress,
            lastSeen: new Date()
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/student', require('./routes/student'));
app.use('/api/volunteer', require('./routes/volunteer'));

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
