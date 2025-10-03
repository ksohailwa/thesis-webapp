# Cognitive Learning Study Web Application

A comprehensive web application implementing research on **active answer generation vs system-provided answers** for learning and retention, with focus on cognitive load and cognitive offloading behaviors.

## 🧠 Research Framework

Based on established cognitive psychology principles:

- **Generation Effect & Desirable Difficulties**: Active generation boosts long-term retention but depends on prior knowledge
- **Cognitive Load Theory**: Measured subjectively via Paas scale and interpreted relative to task demands  
- **Cognitive Offloading**: Measured as in-task behavior (hint usage, support seeking) not just post-hoc questionnaires

### Core Variables
- **IV**: Condition — Self-generated answers (treatment) vs System-provided answers (control)
- **DV**: Immediate recall (transcription) and delayed recall (48–72hrs spelling test)
- **Mediator**: Subjective mental effort (Paas scale), measured mid-task and post-task
- **Behavioral Measures**: Keystroke counts, time on task, hint reveals, audio replays

## 🎯 Implemented Features

### ✅ Core Task Flow
1. **Prior Knowledge Baseline Assessment** - Separate measurement before manipulation
2. **Gap-Fill Task** with audio story playback and target word blanks
3. **Correction Modal** with condition-specific behavior:
   - **Treatment**: Wordle-style letter feedback, progressive hints, forced explanation
   - **Control**: Immediate answer reveal with optional explanation
4. **Transcription Task** for immediate recall measurement
5. **Paas Mental Effort Scale** at mid-task and post-task points
6. **Delayed Recall System** (48-72hr window, scheduled)

### ✅ Behavioral Data Collection
- Real-time keystroke counting and timing
- Audio replay counts and interaction patterns  
- Hint usage tracking and progressive reveal system
- Attempt counting and error patterns
- Time-on-task measurements per component

### ✅ Experimental Controls
- Counterbalanced condition assignment
- Randomized word order in delayed testing
- Proper separation of prior knowledge from manipulation
- Levenshtein distance scoring for spelling accuracy

## 🛠️ Technical Stack

**Backend** (Node.js/Express):
- MongoDB for data storage
- JWT authentication 
- Event logging system
- Levenshtein distance scoring
- Audio file serving
- RESTful API endpoints

**Frontend** (React/Vite):
- Component-based UI with task flow orchestration
- Real-time behavioral tracking
- Responsive design for various devices
- Multi-language support (i18next)
- Progressive Web App capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or remote)
- Optional: eSpeak/ffmpeg for text-to-speech

### Backend Setup
```bash
cd thesis-webapp-backend
npm install
cp .env.example .env  # Edit database connection
npm run dev
```

### Frontend Setup
```bash
cd thesis-webapp-frontend
npm install
npm run dev
```

### Test the System
```bash
# From project root
node test-backend.js
```

## 📊 Data Export & Analysis

The system captures:
- **Results Table**: Spelling accuracy, Levenshtein scores, response times
- **Events Table**: Detailed behavioral logs with timestamps
- **Paas Table**: Mental effort ratings with task context
- **Baseline Table**: Prior knowledge assessments

### Export Options
- CSV export for statistical analysis (R, SPSS, Python)
- JSON export for detailed behavioral analysis
- Real-time analytics dashboard

## 🔬 Research Applications

### For Cognitive Psychology Research
- Generation effect studies with objective behavioral measures
- Cognitive load assessment beyond self-report
- Cognitive offloading behavior analysis
- Prior knowledge interaction effects

### For Educational Technology
- Adaptive learning system evaluation
- Hint timing and scaffolding optimization
- Effort-accuracy relationship studies
- Long-term retention measurement

## 📱 User Experience

### Participant Flow
1. **Registration & Consent** - One-time setup with demographic info
2. **Baseline Assessment** - Prior knowledge measurement (6-point familiarity scale)
3. **Learning Phase** - Gap-fill with condition-appropriate correction modals
4. **Immediate Assessment** - Transcription task with behavioral tracking
5. **Delayed Follow-up** - Email notification for 48-72hr recall test

### Teacher/Researcher Dashboard
- Experiment configuration without coding
- Real-time participant monitoring
- Data export and visualization
- Condition assignment management

## 📈 Validation Features

- **Manipulation Checks**: Ensure treatment differences are implemented
- **Attention Checks**: Verify participant engagement
- **Data Quality Filters**: Remove invalid responses automatically
- **Progress Tracking**: Monitor completion rates and drop-offs

## 🔒 Privacy & Ethics

- Informed consent collection
- Data anonymization options
- GDPR-compliant data handling
- Secure participant ID generation
- Optional demographic data collection

## 🎓 Academic Integration

- Compatible with university IRB requirements
- Supports multi-site data collection
- Export formats for major statistical software
- Documentation for replication studies

## 📋 Next Steps

**Remaining Features** (see todo list):
- [ ] Enhanced analytics dashboard
- [ ] Delayed recall testing system
- [ ] Teacher experiment configuration UI
- [ ] Adaptive scaffolding refinements

---

*This application implements findings from cognitive psychology research on generation effects, desirable difficulties, and cognitive load theory to create a robust platform for studying learning processes.*
