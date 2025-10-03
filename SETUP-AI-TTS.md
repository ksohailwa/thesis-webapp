# AI & TTS Integration Setup Guide

## 🚀 **Complete Implementation Overview**

Your thesis webapp now includes:
- ✅ **Google AI Studio** for real story generation
- ✅ **eSpeak TTS** for audio generation  
- ✅ **Complete Pipeline**: Teacher input → LLM → TTS → Student audio
- ✅ **Audio Controls** in gap-fill exercises
- ✅ **Fallback System** when AI/TTS unavailable

## 🔧 **Setup Instructions**

### 1. **Google AI Studio Setup**

#### Get Your API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

#### Add to Environment:
```bash
# Open thesis-webapp-backend/.env
# Replace: your_google_ai_studio_api_key_here
GOOGLE_AI_API_KEY=AIzaSyC-YourActualApiKeyHere...
```

### 2. **eSpeak TTS Setup**

#### Windows Installation:
1. Download eSpeak-ng from: http://espeak.sourceforge.net/download.html
2. Run the installer
3. Add to PATH: `C:\Program Files (x86)\eSpeak NG`
4. Test: Open cmd and type `espeak --version`

#### Linux Installation:
```bash
sudo apt-get update
sudo apt-get install espeak-ng
```

#### macOS Installation:
```bash
brew install espeak-ng
```

### 3. **Test the Installation**

#### Test Backend Services:
```bash
cd thesis-webapp-backend
node -e "
const ai = require('./utils/google-ai-studio');
const tts = require('./utils/tts-espeak');
console.log('Testing AI...', ai.testConnection());
console.log('Testing TTS...');
tts.generateAudio({text: 'Hello world', filename: 'test'});
"
```

#### Test Full Pipeline:
```bash
cd thesis-webapp-backend
node -e "
const generator = require('./utils/llm_mock');
generator.testPipeline().then(console.log);
"
```

## 🎯 **How It Works**

### **Content Generation Pipeline**

```
Teacher clicks "Generate" 
    ↓
Backend receives target words ["computer", "programming", "software"]
    ↓  
Google AI Studio generates story:
"Sarah loved working with her computer every day. She spent hours learning programming languages and developing software applications..."
    ↓
eSpeak TTS generates audio files:
- story_123_title.wav (title audio)
- story_123_p0.wav (paragraph audio)  
- story_123_full.wav (complete story audio)
    ↓
Files saved to public/audio/ directory
    ↓
URLs stored in MongoDB with story
    ↓
Student sees story with audio controls
    ↓
Audio plays when clicked 🎵
```

### **API Integration Details**

#### Google AI Studio Request:
```javascript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

{
  "contents": [{
    "parts": [{
      "text": "Create a story for language learning with words: computer, programming..."
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
```

#### eSpeak TTS Command:
```bash
espeak -v en+f3 -s 175 -w story_123_full.wav "Sarah loved working with her computer..."
```

## 🎮 **Testing Your Implementation**

### **Step 1: Start Servers**
```bash
# Terminal 1: Backend
cd thesis-webapp-backend
npm start

# Terminal 2: Frontend  
cd thesis-webapp-frontend
npm run dev
```

### **Step 2: Test Story Generation**
1. Go to http://localhost:5173
2. Login as teacher
3. Create new experiment or select existing one
4. Add target words: `computer, programming, algorithm`
5. Click **"Generate"** button
6. Watch backend console for AI generation logs

### **Step 3: Test Audio Generation**
1. After story generation completes
2. Go to student view: `/gapfill?experimentId=YOUR_EXPERIMENT_ID`
3. Look for audio controls: 🎵 🎧 📻
4. Click play buttons to test audio

### **Step 4: Verify File Generation**
```bash
# Check audio files were created
ls thesis-webapp-backend/public/audio/
# Should show: .wav files for stories

# Test direct audio access
# http://localhost:4000/audio/story_123_full.wav
```

## 🔄 **Fallback System**

### **When AI is Unavailable:**
- Uses enhanced mock story generation
- Still includes target words naturally
- No audio generation (graceful degradation)

### **When TTS is Unavailable:**
- Story generation still works
- Audio controls hidden automatically
- Text-only experience

### **Error Handling:**
- All failures logged to console
- User sees meaningful error messages
- System continues functioning

## 🎵 **Audio Features**

### **Generated Audio Files:**
- **Title Audio**: Just the story title
- **Full Story Audio**: Complete story narration
- **Paragraph Audio**: Individual paragraph sections

### **Audio Controls:**
- HTML5 audio players with native controls
- Preload metadata for faster loading
- Responsive design for mobile devices
- WAV format for quality and compatibility

### **File Management:**
- Automatic filename generation (hash-based)
- Duplicate detection (no re-generation)
- Cleanup script for old files
- Configurable storage paths

## 📱 **User Experience**

### **Teacher Workflow:**
1. **Input Target Words**: "computer, programming, database"
2. **Click Generate**: AI creates story + audio
3. **Review Content**: See generated story with audio preview
4. **Share with Students**: Send experiment ID

### **Student Experience:**
1. **Access Exercise**: Click experiment link  
2. **Listen to Story**: Use audio controls to hear narration
3. **Complete Gaps**: Fill blanks while listening
4. **Replay Audio**: Re-listen as needed for comprehension

## ⚡ **Performance Optimizations**

### **Caching:**
- Audio files cached by filename hash
- Duplicate stories don't regenerate audio
- Browser caches audio files locally

### **Async Processing:**
- Story generation doesn't block UI
- Audio generation happens in background
- Progress feedback to teachers

### **Storage Management:**
- Configurable audio storage location
- Automatic cleanup of old files
- Compression options for larger deployments

## 🚨 **Troubleshooting**

### **"AI generation failed":**
- Check Google AI Studio API key in .env
- Verify internet connection
- Check API quota limits
- Falls back to mock generation

### **"TTS generation failed":**
- Verify eSpeak installation: `espeak --version`
- Check PATH environment variable
- Ensure write permissions to audio directory
- Story still works without audio

### **"Audio won't play":**
- Check browser audio support
- Verify audio file exists: http://localhost:4000/audio/filename.wav
- Check file permissions
- Try different browser

### **"No audio controls visible":**
- Check if audio URLs are in stimulus data
- Verify TTS generation succeeded
- Look for audio properties in story object

## 🎉 **You're Ready!**

Your webapp now has:
- **🤖 AI-Generated Stories** with natural target word integration
- **🎵 Text-to-Speech Audio** for listening comprehension  
- **📚 Complete Learning Experience** with text + audio
- **🔄 Robust Fallbacks** for reliability
- **📱 Responsive Design** for all devices

**Test it now**: Generate a story with your favorite target words and hear the AI bring it to life! 🚀
