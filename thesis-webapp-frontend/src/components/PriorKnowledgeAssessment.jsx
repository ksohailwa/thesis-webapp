import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

export default function PriorKnowledgeAssessment({ 
  stimulus, 
  participantId, 
  experimentId,
  onComplete,
  onSkip 
}) {
  const { t } = useTranslation()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [responses, setResponses] = useState({})
  const [startTime] = useState(Date.now())
  const [wordStartTime, setWordStartTime] = useState(Date.now())
  const [submitting, setSubmitting] = useState(false)
  
  const locale = localStorage.getItem('locale') || 'en'
  
  // Extract target words from stimulus
  const getTargetWords = () => {
    if (!stimulus || !Array.isArray(stimulus.target_words)) return []
    
    return stimulus.target_words.map(tw => {
      if (!tw || !tw.word) return { word: '', definition: '' }
      
      const word = typeof tw.word === 'string' ? tw.word : 
                  (tw.word && (tw.word[locale] || Object.values(tw.word)[0])) || ''
      
      const definition = typeof tw.definition === 'string' ? tw.definition :
                        (tw.definition && (tw.definition[locale] || Object.values(tw.definition)[0])) || ''
      
      return { word, definition }
    }).filter(tw => tw.word.trim() !== '')
  }
  
  const targetWords = getTargetWords()
  const currentWord = targetWords[currentWordIndex]
  const isLastWord = currentWordIndex >= targetWords.length - 1
  
  // Reset word start time when word changes
  useEffect(() => {
    setWordStartTime(Date.now())
  }, [currentWordIndex])
  
  // Handle response for current word
  function handleResponseChange(field, value) {
    const wordKey = `word_${currentWordIndex}`
    setResponses(prev => ({
      ...prev,
      [wordKey]: {
        ...prev[wordKey],
        [field]: value,
        wordIndex: currentWordIndex,
        targetWord: currentWord?.word || ''
      }
    }))
  }
  
  // Move to next word or complete
  async function handleNext() {
    const wordKey = `word_${currentWordIndex}`
    const response = responses[wordKey] || {}
    
    // Ensure we have at least a familiarity rating
    if (!response.familiarity) {
      alert('Please rate your familiarity with this word before continuing.')
      return
    }
    
    try {
      // Log this word's assessment
      await logWordAssessment(currentWordIndex, response)
      
      if (isLastWord) {
        // Complete the assessment
        await completeAssessment()
      } else {
        // Move to next word
        setCurrentWordIndex(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error handling next:', error)
      alert('Error saving response. Please try again.')
    }
  }
  
  // Log individual word assessment
  async function logWordAssessment(wordIndex, response) {
    const timeSpent = (Date.now() - wordStartTime) / 1000
    
    await api.submitResult({
      participantId,
      experimentId,
      itemId: `${stimulus?.storyId || 'unknown'}-baseline-${wordIndex}`,
      phase: 'baseline_knowledge',
      response: JSON.stringify({
        word: currentWord?.word || '',
        familiarity: response.familiarity,
        definition: response.definition || '',
        confidence: response.confidence || null,
        spelling: response.spelling || '',
        wordIndex
      }),
      correct: currentWord?.word || '',
      metadata: {
        taskType: 'prior_knowledge_assessment',
        timeSpentSeconds: timeSpent,
        wordIndex,
        targetWord: currentWord?.word || '',
        correctDefinition: currentWord?.definition || ''
      }
    })
  }
  
  // Complete the full assessment
  async function completeAssessment() {
    setSubmitting(true)
    
    try {
      const totalTime = (Date.now() - startTime) / 1000
      
      // Submit summary result
      await api.submitResult({
        participantId,
        experimentId,
        itemId: `${stimulus?.storyId || 'unknown'}-baseline-complete`,
        phase: 'baseline_complete',
        response: JSON.stringify({
          totalWords: targetWords.length,
          totalTimeSeconds: totalTime,
          responsesSummary: Object.keys(responses).reduce((acc, key) => {
            const resp = responses[key]
            acc[resp.targetWord] = {
              familiarity: resp.familiarity,
              hasDefinition: !!(resp.definition && resp.definition.trim()),
              hasSpelling: !!(resp.spelling && resp.spelling.trim()),
              confidence: resp.confidence
            }
            return acc
          }, {})
        }),
        correct: 'baseline_assessment_complete',
        metadata: {
          taskType: 'prior_knowledge_complete',
          totalTimeSeconds: totalTime,
          wordsAssessed: targetWords.length
        }
      })
      
      onComplete && onComplete({
        responses,
        totalTime,
        wordsAssessed: targetWords.length
      })
      
    } catch (error) {
      console.error('Error completing assessment:', error)
      alert('Error completing assessment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  // Skip assessment
  function handleSkip() {
    onSkip && onSkip()
  }
  
  if (!stimulus || targetWords.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>No Words to Assess</h2>
        <p>No target words found for baseline assessment.</p>
        <button className="button" onClick={handleSkip}>
          Skip Assessment
        </button>
      </div>
    )
  }
  
  if (!currentWord) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Assessment Complete</h2>
        <p>All words have been assessed.</p>
      </div>
    )
  }
  
  const currentResponse = responses[`word_${currentWordIndex}`] || {}
  
  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px'
    }}>
      <div style={{
        marginBottom: '24px',
        textAlign: 'center',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '6px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#333' }}>
          Prior Knowledge Assessment
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
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h3 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#2e7d32',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            {currentWord.word}
          </h3>
          
          <p style={{ 
            fontSize: '16px', 
            color: '#555',
            margin: 0,
            fontStyle: 'italic'
          }}>
            How well do you know this word?
          </p>
        </div>
        
        {/* Familiarity Rating (Required) */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '12px',
            fontSize: '16px'
          }}>
            <span style={{ color: '#d32f2f' }}>*</span> Familiarity Rating:
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { value: 1, label: "Never seen this word before" },
              { value: 2, label: "Seen it but don't know the meaning" },
              { value: 3, label: "Have a vague idea of the meaning" },
              { value: 4, label: "Know the meaning but rarely use it" },
              { value: 5, label: "Know it well and use it sometimes" },
              { value: 6, label: "Very familiar - use it regularly" }
            ].map(option => (
              <label 
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: currentResponse.familiarity === option.value ? '2px solid #4CAF50' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: currentResponse.familiarity === option.value ? '#f8fff8' : 'white',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleResponseChange('familiarity', option.value)}
              >
                <input
                  type="radio"
                  name={`familiarity-${currentWordIndex}`}
                  value={option.value}
                  checked={currentResponse.familiarity === option.value}
                  onChange={() => handleResponseChange('familiarity', option.value)}
                  style={{ margin: 0 }}
                />
                <span style={{ fontWeight: 'bold', minWidth: '20px' }}>
                  {option.value}
                </span>
                <span style={{ flex: 1 }}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Definition (if familiar) */}
        {currentResponse.familiarity >= 3 && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              What do you think this word means? (Optional)
            </label>
            <textarea
              value={currentResponse.definition || ''}
              onChange={e => handleResponseChange('definition', e.target.value)}
              placeholder="Enter your definition or explanation..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif'
              }}
            />
          </div>
        )}
        
        {/* Spelling Test (if somewhat familiar) */}
        {currentResponse.familiarity >= 2 && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Try spelling this word: (Optional)
            </label>
            <input
              type="text"
              value={currentResponse.spelling || ''}
              onChange={e => handleResponseChange('spelling', e.target.value)}
              placeholder="Type how you think it's spelled..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '16px'
              }}
            />
          </div>
        )}
        
        {/* Confidence Rating (if attempted definition or spelling) */}
        {((currentResponse.definition && currentResponse.definition.trim()) || 
          (currentResponse.spelling && currentResponse.spelling.trim())) && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              How confident are you in your answer?
            </label>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 1, label: "Not confident" },
                { value: 2, label: "Somewhat confident" },
                { value: 3, label: "Confident" },
                { value: 4, label: "Very confident" }
              ].map(option => (
                <label 
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    border: currentResponse.confidence === option.value ? '2px solid #2196F3' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: currentResponse.confidence === option.value ? '#e3f2fd' : 'white'
                  }}
                  onClick={() => handleResponseChange('confidence', option.value)}
                >
                  <input
                    type="radio"
                    name={`confidence-${currentWordIndex}`}
                    value={option.value}
                    checked={currentResponse.confidence === option.value}
                    onChange={() => handleResponseChange('confidence', option.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          className="button"
          onClick={handleSkip}
          style={{ 
            backgroundColor: '#f5f5f5', 
            color: '#333',
            fontSize: '14px'
          }}
        >
          Skip Assessment
        </button>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Time on word: {Math.floor((Date.now() - wordStartTime) / 1000)}s
          </span>
          
          <button
            className="button"
            onClick={handleNext}
            disabled={!currentResponse.familiarity || submitting}
            style={{
              backgroundColor: currentResponse.familiarity ? (isLastWord ? '#4CAF50' : '#2196F3') : '#ddd',
              color: 'white',
              padding: '12px 24px',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? 'Saving...' : (isLastWord ? 'Complete Assessment' : 'Next Word')}
          </button>
        </div>
      </div>
      
      {/* Instructions */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#fff3e0',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#e65100'
      }}>
        <strong>Instructions:</strong> This assessment measures your existing knowledge of words that will appear in the learning task. 
        Be honest - there are no right or wrong answers here. This helps us understand how prior knowledge affects learning.
      </div>
    </div>
  )
}
