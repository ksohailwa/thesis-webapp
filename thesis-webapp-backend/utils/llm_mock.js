// Real content generation using Google AI Studio + eSpeak TTS
const googleAI = require('./google-ai-studio');
const ttsEngine = require('./tts-espeak');

class ContentGenerator {
  /**
   * Generate a complete story with text and audio
   * @param {Object} params - Generation parameters
   * @param {string} params.language - Target language (en, de, etc.)
   * @param {string[]} params.targetWords - Words to include in the story
   * @param {string} params.difficulty - Difficulty level (beginner, intermediate, advanced)
   * @param {string} params.theme - Story theme/topic
   * @returns {Promise<Object>} Generated story with audio URLs
   */
  async generateStory({ language = 'en', targetWords = [], difficulty = 'intermediate', theme = 'general' }) {
    console.log(`Generating story with AI - Language: ${language}, Words: ${targetWords.join(', ')}`);
    
    try {
      // Step 1: Generate story text with Google AI Studio
      const story = await googleAI.generateStory({
        targetWords,
        language,
        difficulty,
        theme,
        wordCount: 200
      });
      
      console.log(`Story generated: ${story.storyId}`);
      
      // Step 2: Generate audio for the story using eSpeak TTS
      const storyWithAudio = await ttsEngine.generateStoryAudio(story, language);
      
      console.log(`Audio generation completed for story: ${story.storyId}`);
      
      return {
        ...storyWithAudio,
        // Add metadata for tracking
        generation: {
          timestamp: new Date(),
          source: 'google-ai-studio',
          tts: 'espeak',
          language,
          difficulty,
          theme,
          targetWords
        }
      };
      
    } catch (error) {
      console.error('Content generation failed:', error.message);
      
      // Fallback to mock story if AI generation fails
      return this.getMockStory({ language, targetWords });
    }
  }
  
  /**
   * Fallback mock story for when AI generation fails
   */
  getMockStory({ language = 'en', targetWords = [] }) {
    console.log('Using mock story generation as fallback');
    
    const { v4: uuidv4 } = require('uuid');
    const storyId = 'mock_' + uuidv4().slice(0,8);
    
    const titleMap = {
      en: 'Learning Story',
      de: 'Lerngeschichte',
      es: 'Historia de Aprendizaje',
      fr: 'Histoire d\'Apprentissage'
    };
    
    const title = titleMap[language] || titleMap.en;
    
    const storyTemplates = {
      en: `Once upon a time, there was a curious student who wanted to learn about ${targetWords[0] || 'technology'}. Every day, they would practice with ${targetWords[1] || 'computers'} and study ${targetWords[2] || 'programming'}. They discovered that learning ${targetWords[3] || 'languages'} required patience and ${targetWords[4] || 'dedication'}. Through hard work, they became skilled in many areas.`,
      de: `Es war einmal ein neugieriger Student, der ${targetWords[0] || 'Technologie'} lernen wollte. Jeden Tag übte er mit ${targetWords[1] || 'Computern'} und studierte ${targetWords[2] || 'Programmierung'}. Er entdeckte, dass das Lernen von ${targetWords[3] || 'Sprachen'} Geduld und ${targetWords[4] || 'Hingabe'} erforderte. Durch harte Arbeit wurde er in vielen Bereichen geschickt.`
    };
    
    const storyText = storyTemplates[language] || storyTemplates.en;
    
    return {
      storyId,
      title,
      paragraphs: [{ text: storyText, index: 0 }],
      target_words: targetWords.map(word => ({
        word: { [language]: word },
        occurrences: [{ paragraph: 0, offset: storyText.indexOf(word) || 0 }]
      })),
      metadata: {
        generatedAt: new Date(),
        language,
        source: 'mock',
        targetWords
      },
      // No audio for mock stories
      titleAudio: null,
      fullAudioUrl: null
    };
  }
  
  /**
   * Test the content generation pipeline
   */
  async testPipeline() {
    console.log('Testing content generation pipeline...');
    
    try {
      const testStory = await this.generateStory({
        language: 'en',
        targetWords: ['computer', 'learning'],
        difficulty: 'beginner',
        theme: 'technology'
      });
      
      return {
        success: true,
        storyGenerated: !!testStory.storyId,
        audioGenerated: !!testStory.fullAudioUrl,
        source: testStory.metadata?.source || testStory.generation?.source
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export both the new class and maintain backward compatibility
const contentGenerator = new ContentGenerator();

module.exports = {
  generateStory: contentGenerator.generateStory.bind(contentGenerator),
  testPipeline: contentGenerator.testPipeline.bind(contentGenerator)
};
