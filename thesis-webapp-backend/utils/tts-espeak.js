const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ESpeakTTSAdapter {
  constructor() {
    this.audioStoragePath = process.env.AUDIO_STORAGE_PATH || './public/audio';
    this.audioBaseURL = process.env.AUDIO_BASE_URL || 'http://localhost:4000/audio';
    this.defaultVoice = 'en+f3'; // Female voice, variant 3
    
    // Ensure audio storage directory exists
    this.ensureAudioDirectory();
    
    // Test eSpeak availability on startup
    this.testESpeakAvailability();
  }

  async ensureAudioDirectory() {
    try {
      await fs.mkdir(this.audioStoragePath, { recursive: true });
      console.log(`Audio storage directory ready: ${this.audioStoragePath}`);
    } catch (error) {
      console.error('Failed to create audio storage directory:', error.message);
    }
  }

  async testESpeakAvailability() {
    try {
      const result = await this.runCommand('espeak', ['--version']);
      console.log('eSpeak TTS available:', result.stdout.split('\n')[0]);
      return true;
    } catch (error) {
      console.warn('eSpeak not found. Please install eSpeak-ng for TTS functionality');
      console.warn('Windows: Download from http://espeak.sourceforge.net/download.html');
      console.warn('Linux: sudo apt-get install espeak-ng');
      console.warn('macOS: brew install espeak-ng');
      return false;
    }
  }

  /**
   * Generate audio from text using eSpeak
   * @param {Object} params - TTS parameters
   * @param {string} params.text - Text to convert to speech
   * @param {string} params.language - Language code (en, de, es, fr)
   * @param {string} params.voice - Voice variant (optional)
   * @param {number} params.speed - Speech speed (words per minute, default 175)
   * @param {string} params.filename - Output filename (without extension)
   * @returns {Promise<Object>} Audio file information
   */
  async generateAudio({ text, language = 'en', voice = null, speed = 175, filename = null }) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for TTS generation');
    }

    // Generate filename if not provided
    const audioFilename = filename || this.generateFilename(text, language);
    const audioPath = path.join(this.audioStoragePath, `${audioFilename}.wav`);
    const audioURL = `${this.audioBaseURL}/${audioFilename}.wav`;

    // Check if audio already exists
    if (await this.fileExists(audioPath)) {
      console.log(`Audio file already exists: ${audioFilename}.wav`);
      return {
        success: true,
        filename: `${audioFilename}.wav`,
        path: audioPath,
        url: audioURL,
        cached: true
      };
    }

    try {
      // Build eSpeak command
      const espeakVoice = voice || this.getVoiceForLanguage(language);
      const args = [
        '-v', espeakVoice,     // Voice
        '-s', speed.toString(), // Speed (words per minute)
        '-w', audioPath,       // Output to WAV file
        text                   // Text to speak
      ];

      console.log(`Generating TTS audio: ${audioFilename}.wav`);
      console.log(`Command: espeak ${args.join(' ')}`);

      const result = await this.runCommand('espeak', args);
      
      // Verify file was created
      if (await this.fileExists(audioPath)) {
        const stats = await fs.stat(audioPath);
        console.log(`TTS audio generated successfully: ${audioFilename}.wav (${stats.size} bytes)`);
        
        return {
          success: true,
          filename: `${audioFilename}.wav`,
          path: audioPath,
          url: audioURL,
          size: stats.size,
          cached: false
        };
      } else {
        throw new Error('Audio file was not created');
      }

    } catch (error) {
      console.error('TTS generation failed:', error.message);
      
      // Return a fallback result for graceful degradation
      return {
        success: false,
        error: error.message,
        filename: null,
        path: null,
        url: null
      };
    }
  }

  /**
   * Generate audio for a complete story
   * @param {Object} story - Story object with paragraphs
   * @param {string} language - Language code
   * @returns {Promise<Object>} Complete story with audio URLs
   */
  async generateStoryAudio(story, language = 'en') {
    const storyWithAudio = { ...story };
    
    // Generate audio for title
    if (story.title && story.title[language]) {
      try {
        const titleAudio = await this.generateAudio({
          text: story.title[language],
          language,
          filename: `${story.storyId}_title`
        });
        
        storyWithAudio.titleAudio = titleAudio.success ? titleAudio.url : null;
      } catch (error) {
        console.warn('Failed to generate title audio:', error.message);
      }
    }

    // Generate audio for each paragraph
    if (story.paragraphs && Array.isArray(story.paragraphs)) {
      storyWithAudio.paragraphs = await Promise.all(
        story.paragraphs.map(async (paragraph, index) => {
          try {
            const audio = await this.generateAudio({
              text: paragraph.text,
              language,
              filename: `${story.storyId}_p${index}`
            });
            
            return {
              ...paragraph,
              audioUrl: audio.success ? audio.url : null
            };
          } catch (error) {
            console.warn(`Failed to generate audio for paragraph ${index}:`, error.message);
            return paragraph;
          }
        })
      );
    }

    // Generate audio for complete story (all paragraphs combined)
    try {
      const fullText = story.paragraphs
        ?.map(p => p.text)
        ?.join(' ') || '';
      
      if (fullText.trim().length > 0) {
        const fullAudio = await this.generateAudio({
          text: fullText,
          language,
          filename: `${story.storyId}_full`
        });
        
        storyWithAudio.fullAudioUrl = fullAudio.success ? fullAudio.url : null;
      }
    } catch (error) {
      console.warn('Failed to generate full story audio:', error.message);
    }

    return storyWithAudio;
  }

  /**
   * Get appropriate voice for language
   */
  getVoiceForLanguage(language) {
    const voiceMap = {
      'en': 'en+f3',      // English female
      'de': 'de+f1',      // German female  
      'es': 'es+f1',      // Spanish female
      'fr': 'fr+f1',      // French female
      'it': 'it+f1',      // Italian female
      'pt': 'pt+f1',      // Portuguese female
    };
    
    return voiceMap[language] || 'en+f3';
  }

  /**
   * Generate a filename from text and language
   */
  generateFilename(text, language) {
    // Create a hash of the text for consistent filename
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(text + language).digest('hex').substring(0, 8);
    return `tts_${language}_${hash}`;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run command and return promise
   */
  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to start command: ${error.message}`));
      });
    });
  }

  /**
   * List available voices
   */
  async getAvailableVoices() {
    try {
      const result = await this.runCommand('espeak', ['--voices']);
      const voices = result.stdout
        .split('\n')
        .slice(1) // Skip header
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            priority: parts[0],
            language: parts[1],
            age: parts[2],
            gender: parts[3],
            name: parts[4],
            file: parts[5]
          };
        });
      
      return voices;
    } catch (error) {
      console.error('Failed to get available voices:', error.message);
      return [];
    }
  }

  /**
   * Clean up old audio files (older than specified days)
   */
  async cleanupOldFiles(daysOld = 7) {
    try {
      const files = await fs.readdir(this.audioStoragePath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;
      for (const file of files) {
        if (file.endsWith('.wav')) {
          const filePath = path.join(this.audioStoragePath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} old audio files`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old files:', error.message);
      return 0;
    }
  }
}

module.exports = new ESpeakTTSAdapter();
