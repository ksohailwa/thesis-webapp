const axios = require('axios');

class GoogleAIStudioAdapter {
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    if (!this.apiKey) {
      console.warn('Google AI Studio API key not found. Stories will use mock data.');
    }
  }

  /**
   * Generate a story with specific target words for language learning
   * @param {Object} params - Generation parameters
   * @param {string[]} params.targetWords - Words to include in the story
   * @param {string} params.language - Target language (en, de, etc.)
   * @param {string} params.difficulty - Difficulty level (beginner, intermediate, advanced)
   * @param {string} params.theme - Story theme/topic
   * @param {number} params.wordCount - Approximate word count
   * @returns {Promise<Object>} Generated story with metadata
   */
  async generateStory({ targetWords = [], language = 'en', difficulty = 'intermediate', theme = 'general', wordCount = 200 }) {
    if (!this.apiKey) {
      return this.getMockStory({ targetWords, language });
    }

    try {
      const prompt = this.buildStoryPrompt({ targetWords, language, difficulty, theme, wordCount });
      
      const response = await axios.post(`${this.baseURL}?key=${this.apiKey}`, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const storyText = response.data.candidates[0].content.parts[0].text.trim();
        return this.parseStoryResponse(storyText, { targetWords, language });
      } else {
        console.warn('Invalid response from Google AI Studio, using mock data');
        return this.getMockStory({ targetWords, language });
      }

    } catch (error) {
      console.error('Google AI Studio API error:', error.message);
      console.warn('Falling back to mock story generation');
      return this.getMockStory({ targetWords, language });
    }
  }

  /**
   * Build the prompt for story generation
   */
  buildStoryPrompt({ targetWords, language, difficulty, theme, wordCount }) {
    const languageNames = {
      en: 'English',
      de: 'German',
      es: 'Spanish',
      fr: 'French'
    };

    const difficultyDescriptions = {
      beginner: 'simple vocabulary and short sentences',
      intermediate: 'moderate vocabulary and varied sentence structures',
      advanced: 'complex vocabulary and sophisticated sentence structures'
    };

    return `Create a coherent, engaging story in ${languageNames[language] || 'English'} for language learning purposes.

Requirements:
- Target audience: ${difficulty} level learners
- Story length: approximately ${wordCount} words
- Theme: ${theme}
- Difficulty: Use ${difficultyDescriptions[difficulty] || 'moderate vocabulary and varied sentence structures'}
- MUST include these specific words: ${targetWords.join(', ')}

Instructions:
1. Write a natural, flowing story that incorporates ALL the target words naturally
2. Make the context clear so learners can understand word meanings
3. Use the target words in meaningful contexts
4. Keep the story engaging and coherent
5. Ensure the story is appropriate for language learning

Target words to include: ${targetWords.join(', ')}

Please write the story now:`;
  }

  /**
   * Parse the AI response and structure it for our application
   */
  parseStoryResponse(storyText, { targetWords, language }) {
    // Split story into paragraphs
    const paragraphs = storyText.split('\n\n')
      .filter(p => p.trim().length > 0)
      .map((text, index) => ({
        text: text.trim(),
        order: index
      }));

    // Create target words array with metadata
    const targetWordsWithMeta = targetWords.map(word => ({
      word: { [language]: word },
      difficulty: this.estimateWordDifficulty(word),
      partOfSpeech: 'unknown' // Could be enhanced with NLP
    }));

    return {
      storyId: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: { [language]: this.extractTitle(storyText) || 'Generated Story' },
      paragraphs,
      target_words: targetWordsWithMeta,
      metadata: {
        generatedAt: new Date(),
        language,
        wordCount: this.countWords(storyText),
        source: 'google-ai-studio',
        targetWords: targetWords
      }
    };
  }

  /**
   * Extract a title from the story or generate one
   */
  extractTitle(storyText) {
    const lines = storyText.split('\n');
    const firstLine = lines[0].trim();
    
    // If first line looks like a title (short and possibly capitalized)
    if (firstLine.length < 60 && firstLine.length > 5) {
      return firstLine;
    }
    
    // Generate a simple title from first few words
    const words = storyText.split(' ').slice(0, 5);
    return words.join(' ').replace(/[.!?]$/, '') + '...';
  }

  /**
   * Estimate word difficulty (simple heuristic)
   */
  estimateWordDifficulty(word) {
    if (word.length <= 4) return 1;
    if (word.length <= 7) return 2;
    return 3;
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Fallback mock story for when API is unavailable
   */
  getMockStory({ targetWords, language }) {
    const storyTemplates = {
      en: `Once upon a time, there was a curious student who loved learning about technology. Every day, they would study {word1} programming and work with their {word2} to solve complex problems. They discovered that {word3} development required patience and creativity. The {word4} they built helped many people, and they felt proud of their {word5} skills.`,
      de: `Es war einmal ein neugieriger Student, der gerne über Technologie lernte. Jeden Tag studierte er {word1} Programmierung und arbeitete mit seinem {word2}, um komplexe Probleme zu lösen. Er entdeckte, dass {word3} Entwicklung Geduld und Kreativität erforderte. Das {word4}, das er baute, half vielen Menschen, und er war stolz auf seine {word5} Fähigkeiten.`
    };

    let template = storyTemplates[language] || storyTemplates.en;
    
    // Replace placeholders with actual target words
    targetWords.forEach((word, index) => {
      template = template.replace(`{word${index + 1}}`, word);
    });

    // Fill remaining placeholders with the first target word
    template = template.replace(/\{word\d+\}/g, targetWords[0] || 'example');

    return {
      storyId: `mock_story_${Date.now()}`,
      title: { [language]: 'Sample Learning Story' },
      paragraphs: [{ text: template, order: 0 }],
      target_words: targetWords.map(word => ({
        word: { [language]: word },
        difficulty: this.estimateWordDifficulty(word)
      })),
      metadata: {
        generatedAt: new Date(),
        language,
        wordCount: this.countWords(template),
        source: 'mock',
        targetWords: targetWords
      }
    };
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    if (!this.apiKey) {
      return { success: false, message: 'No API key configured' };
    }

    try {
      await this.generateStory({ 
        targetWords: ['test'], 
        language: 'en',
        wordCount: 50
      });
      return { success: true, message: 'Google AI Studio connection successful' };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }
}

module.exports = new GoogleAIStudioAdapter();
