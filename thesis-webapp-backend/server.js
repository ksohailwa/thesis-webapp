require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');


const authRoutes = require('./routes/auth');
const participantsRoutes = require('./routes/participants');
const experimentsRoutes = require('./routes/experiments');
const tasksRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');
const delayedRecallRoutes = require('./routes/delayed-recall');
const studentsRoutes = require('./routes/students');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Serve static audio files
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));
console.log('Audio files served from:', path.join(__dirname, 'public/audio'));


const PORT = process.env.PORT || 4000;


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
useNewUrlParser: true,
useUnifiedTopology: true
}).then(() => {
console.log('Connected to MongoDB');
}).catch(err => {
console.error('MongoDB connection error:', err.message);
process.exit(1);
});


// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/participants', participantsRoutes);
app.use('/v1/experiments', experimentsRoutes);
app.use('/v1/tasks', tasksRoutes);
app.use('/v1/analytics', analyticsRoutes);
app.use('/v1/delayed-recall', delayedRecallRoutes);
app.use('/v1/students', require('./routes/students'));

app.get('/', (req, res) => res.send('Thesis WebApp Backend running'));


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
