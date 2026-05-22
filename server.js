const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://karama:karama123@cluster.mongodb.net/karama-youth', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected')).catch(err => console.log('❌ DB Error:', err));

// Models
const User = require('./models/User');
const Message = require('./models/Message');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');
const Visitor = require('./models/Visitor');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));

// API: Get Team Members
app.get('/api/team', async (req, res) => {
  try {
    const members = [
      { id: 1, name: 'زياد البسيوني', position: 'منسق طلاب لأجل فلسطين', role: 'founder', avatar: '👨‍💼' },
      { id: 2, name: 'خالد البسيوني', position: 'مدير الإنتاج', role: 'editor', avatar: '🎬' },
      { id: 3, name: 'محمود فهمي', position: 'صحفي وكاتب البيانات', role: 'editor', avatar: '📝' },
      { id: 4, name: 'أمين عمرو', position: 'الشأن الإقليمي - الشرقية', role: 'member', avatar: '🌍' },
      { id: 5, name: 'سماء معاوية', position: 'الفاعليات والتواصل', role: 'member', avatar: '👩‍💼' },
      { id: 6, name: 'مريم إبراهيم', position: 'العلاقات الدولية - قطر', role: 'member', avatar: '🌐' },
      { id: 7, name: 'وفاء سلامة', position: 'إنتاج البرامج والبحث', role: 'editor', avatar: '📺' },
      { id: 8, name: 'أماني عمرو', position: 'المونتاج والتحضير', role: 'member', avatar: '✂️' },
      { id: 9, name: 'عبد الرحمن القاضي', position: 'المونتير الأساسي', role: 'editor', avatar: '🎞️' },
      { id: 10, name: 'سما علي', position: 'المساندة والدعم', role: 'member', avatar: '🤝' }
    ];
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get Activities
app.get('/api/activities', async (req, res) => {
  try {
    const activities = [
      {
        id: 1,
        title: 'ورشة الوعي السياسي',
        date: '2024-07-20',
        icon: '👥',
        description: 'نقاش عن الوعي السياسي والمشاركة الشبابية'
      },
      {
        id: 2,
        title: 'مشاركة في فعالية طلابية',
        date: '2024-07-15',
        icon: '🎓',
        description: 'مشاركة شباب الكرامة في ملتقى طلابي تحت شعار "صوت شباب الوطن"'
      },
      {
        id: 3,
        title: 'مقال جديد عن الرؤية',
        date: '2024-07-10',
        icon: '📖',
        description: 'نشر مقال جديد بعنوان "أفريقيا" ضمن سلسلة الرؤية المستقبلية'
      },
      {
        id: 4,
        title: 'إطلاق مبادرة "يد بيد"',
        date: '2024-07-05',
        icon: '🤲',
        description: 'إطلاق مبادرة تطوعية للعمل المجتمعي في الأحياء الشعبية'
      }
    ];
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Visitor Counter
app.get('/api/visitors/count', async (req, res) => {
  try {
    const count = await Visitor.countDocuments();
    res.json({ totalVisitors: count || 1000 });
  } catch (err) {
    res.json({ totalVisitors: 1000 });
  }
});

// Socket.io Chat
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    io.to(room).emit('user-joined', { 
      message: `مستخدم جديد انضم للغرفة`,
      users: io.sockets.adapter.rooms.get(room)?.size || 1
    });
  });

  socket.on('send-message', async (data) => {
    try {
      const message = new Message({
        sender: data.userId,
        room: data.room,
        content: data.message
      });
      await message.save();
      io.to(data.room).emit('receive-message', {
        sender: data.senderName,
        content: data.message,
        timestamp: new Date()
      });
    } catch (err) {
      console.log('Error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Visit: http://localhost:${PORT}`);
});
