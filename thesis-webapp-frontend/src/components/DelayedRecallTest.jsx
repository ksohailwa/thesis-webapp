import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function DelayedRecallTest() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Extract participant info from URL
  const participantId = searchParams.get('participantId')
  const experimentId = searchParams.get('experimentId') || '507f1f77bcf86cd799439011'
  const sessionToken = searchParams.get('token') // For security/validation
  
  // Component state
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [responses, setResponses] = useState({})
  const [targetWords, setTargetWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [wordStartTime, setWordStartTime] = useState(Date.now())
  
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const locale = localStorage.getItem('locale') || 'en'

  // Load target words and validate session
  useEffect(() => {
    async function loadDelayedSession() {
      if (!participantId) {
        alert('Invalid session link. Please contact the researcher.')
        return
      }

      try {
        setLoading(true)
        
        // Fetch the original stimulus data to get target words
        const stimulusData = await api.fetchStimuli(experimentId, locale)
        if (!Array.isArray(stimulusData) || stimulusData.length === 0) {
          throw new Error('No experimental content found')
        }

        const stimulus = stimulusData[0]
        const words = extractTargetWords(stimulus)
        
        // Randomize word order for delayed testing
        const shuffledWords = shuffleArray(words)
        setTargetWords(shuffledWords)
        
        // Log session start
        await api.submitResult({
          participantId,
          experimentId,
          itemId: `${stimulus.storyId}-delayed-session-start`,
          phase: 'delayed_recall_start',
          response: 'session_initiated',
          correct: 'session_initiated',
          metadata: {
            taskType: 'delayed_recall_session',
            wordsCount: shuffledWords.length,
            sessionToken: sessionToken,
            timeFromOriginalSession: getTimeSinceOriginalSession()
          }
        })

      } catch (error) {
        console.error('Error loading delayed session:', error)
        alert('Error loading your follow-up session. Please contact the researcher.')
      } finally {
        setLoading(false)
      }
    }

    loadDelayedSession()
  }, [participantId, experimentId, sessionToken, locale])

  // Reset word timer when moving to next word
  useEffect(() => {
    setWordStartTime(Date.now())
    // Focus input when word changes
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentWordIndex])

  // Extract and process target words from stimulus
  function extractTargetWords(stimulus) {
    if (!stimulus || !Array.isArray(stimulus.target_words)) return []
    
    return stimulus.target_words.map((tw, index) => {
      if (!tw || !tw.word) return null
      
      const word = typeof tw.word === 'string' ? tw.word : 
                  (tw.word && (tw.word[locale] || Object.values(tw.word)[0])) || ''
      
      const audioUrl = tw.audioUrl || `audio/words/${word.toLowerCase()}.wav`
      
      return {
        word: word.trim(),
        originalIndex: index,
        audioUrl: audioUrl,
        definition: tw.definition || ''
      }
    }).filter(w => w && w.word)
  }

  // Shuffle array for randomized presentation
  function shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Calculate hours since original session (placeholder - would need to track this)
  function getTimeSinceOriginalSession() {
    // In a real implementation, you'd calculate this from stored session data
    const assumedHoursSince = 60 // Placeholder: assume 60 hours
    return assumedHoursSince
  }

  // Handle spelling response
  function handleResponseChange(value) {
    setResponses(prev => ({
      ...prev,
      [currentWordIndex]: {
        word: currentWord?.word || '',
        response: value,
        originalIndex: currentWord?.originalIndex || -1,
        wordIndex: currentWordIndex,
        timeStarted: wordStartTime,
        attempts: (prev[currentWordIndex]?.attempts || 0) + 1
      }
    }))
  }

  // Play audio for current word
  async function playWordAudio() {
    if (!currentWord?.audioUrl || !audioRef.current) return

    try {
      await audioRef.current.play()
      
      // Log audio play event
      await api.submitAttempt({
        participantId,
        experimentId,
        storyId: 'delayed-recall',
        paragraphIndex: 0,
        blankIndex: currentWordIndex,
        attemptText: 'audio_played',
        attemptNumber: responses[currentWordIndex]?.attempts || 1,
        timeOnBlankSeconds: (Date.now() - wordStartTime) / 1000,
        locale,
        metadata: {
          eventType: 'delayed_audio_play',
          targetWord: currentWord.word,
          wordIndex: currentWordIndex
        }
      })
    } catch (error) {
      console.error('Error playing audio:', error)
      alert('Audio playback failed. Please try again or continue without audio.')
    }
  }

  // Move to next word or complete
  async function handleNext() {
    const response = responses[currentWordIndex]
    if (!response || !response.response?.trim()) {
      alert('Please enter your spelling attempt before continuing.')
      return
    }

    try {
      const timeSpent = (Date.now() - wordStartTime) / 1000

      // Submit result for this word
      await api.submitResult({
        participantId,
        experimentId,
        itemId: `delayed-${currentWord.word}-${currentWordIndex}`,
        phase: 'delayed_recall',
        response: response.response,
        correct: currentWord.word,
        metadata: {
          taskType: 'delayed_spelling_test',
          timeSpentSeconds: timeSpent,
          wordIndex: currentWordIndex,
          originalWordIndex: currentWord.originalIndex,
          targetWord: currentWord.word,
          attempts: response.attempts || 1
        }
      })

      if (currentWordIndex >= targetWords.length - 1) {
        // Complete the delayed session
        await completeDelayedSession()
      } else {
        // Move to next word
        setCurrentWordIndex(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error submitting delayed response:', error)
      alert('Error saving your response. Please try again.')
    }
  }

  // Complete the delayed recall session
  async function completeDelayedSession() {
    setSubmitting(true)
    
    try {
      const totalTime = (Date.now() - startTime) / 1000
      
      // Calculate accuracy statistics
      const accuracyStats = Object.values(responses).map(resp => {
        const correct = resp.word.toLowerCase().trim()
        const response = resp.response.toLowerCase().trim()
        return {
          word: resp.word,
          correct: correct === response,
          levenshteinDistance: calculateLevenshtein(correct, response)
        }
      })

      const overallAccuracy = accuracyStats.filter(stat => stat.correct).length / accuracyStats.length

      // Submit completion summary
      await api.submitResult({
        participantId,
        experimentId,
        itemId: 'delayed-recall-complete',
        phase: 'delayed_recall_complete',
        response: JSON.stringify({
          totalWords: targetWords.length,
          correctCount: accuracyStats.filter(stat => stat.correct).length,
          overallAccuracy: overallAccuracy,
          totalTimeSeconds: totalTime,
          avgTimePerWord: totalTime / targetWords.length
        }),
        correct: 'delayed_session_complete',
        metadata: {
          taskType: 'delayed_recall_complete',
          totalTimeSeconds: totalTime,
          wordsCompleted: targetWords.length,
          accuracyRate: overallAccuracy
        }
      })

      setSessionComplete(true)
      
    } catch (error) {
      console.error('Error completing delayed session:', error)
      alert('Error completing the session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Simple Levenshtein distance calculation
  function calculateLevenshtein(a, b) {
    const matrix = []
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    return matrix[b.length][a.length]
  }

  const currentWord = targetWords[currentWordIndex]
  const currentResponse = responses[currentWordIndex] || {}
  const isLastWord = currentWordIndex >= targetWords.length - 1

  // Loading state
  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Loading Your Follow-Up Session...</h2>
        <div style={{ marginTop: '20px', color: '#666' }}>
          Please wait while we prepare your delayed recall test.
        </div>
      </div>
    )
  }

  // Error state
  if (!participantId || targetWords.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: '#d32f2f' }}>Session Not Found</h2>
        <p>We couldn't find your follow-up session. Please check your link or contact the researcher.</p>
        <button className="button" onClick={() => navigate('/')}>
          Return Home
        </button>
      </div>
    )
  }

  // Completion state
  if (sessionComplete) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: '#4CAF50', marginBottom: '20px' }}>
          🎉 Follow-Up Complete!
        </h2>
        
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#f9f9f9',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Thank You!</h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            You have completed the delayed recall portion of the study. Your responses help us understand 
            how different learning methods affect memory over time.
          </p>
          
          <div style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
            <p><strong>Session Summary:</strong></p>
            <p>• {targetWords.length} words tested</p>
            <p>• {Math.floor((Date.now() - startTime) / 1000)}s total time</p>
            <p>• Completed ~{getTimeSinceOriginalSession()} hours after original session</p>
          </div>
        </div>
        
        <p style={{ fontSize: '14px', color: '#666' }}>
          You may now close this window. If you have any questions about the study, 
          please contact the research team.
        </p>
      </div>
    )
  }

  // Main testing interface
  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        textAlign: 'center',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '6px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#333' }}>
          Follow-Up Memory Test
        </h2>
        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
          Word {currentWordIndex + 1} of {targetWords.length}
        </p>
        
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          marginTop: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentWordIndex + 1) / targetWords.length) * 100}%`,
            height: '100%',
            backgroundColor: '#2196F3',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Word testing interface */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            Listen to the word and spell it:
          </p>
          
          {/* Audio playback */}
          <button
            onClick={playWordAudio}
            className="button"
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              padding: '12px 24px',
              fontSize: '16px',
              marginBottom: '20px'
            }}
          >
            🔊 Play Word Audio
          </button>

          <audio
            ref={audioRef}
            preload="metadata"
            style={{ display: 'none' }}
          >
            <source src={currentWord?.audioUrl} type="audio/wav" />
            <source src={currentWord?.audioUrl} type="audio/mp3" />
          </audio>
        </div>

        {/* Spelling input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '12px',
            fontSize: '16px'
          }}>
            Your spelling:
          </label>
          
          <input
            ref={inputRef}
            type="text"
            value={currentResponse.response || ''}
            onChange={e => handleResponseChange(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                handleNext()
              }
            }}
            placeholder="Type the word as you heard it..."
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '20px',
              textAlign: 'center',
              borderRadius: '6px',
              border: '2px solid #ddd',
              fontFamily: 'monospace',
              letterSpacing: '2px'
            }}
          />
          
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Press Enter to continue or use the button below
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Time on word: {Math.floor((Date.now() - wordStartTime) / 1000)}s
        </div>
        
        <button
          onClick={handleNext}
          disabled={!currentResponse.response?.trim() || submitting}
          className="button"
          style={{
            backgroundColor: currentResponse.response?.trim() ? (isLastWord ? '#4CAF50' : '#2196F3') : '#ddd',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? 'Submitting...' : (isLastWord ? 'Complete Test' : 'Next Word')}
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#1976d2'
      }}>
        <strong>Instructions:</strong> Listen carefully to each word and spell it as accurately as possible. 
        You can replay the audio as many times as needed. Take your time - there's no rush.
      </div>
    </div>
  )
}
