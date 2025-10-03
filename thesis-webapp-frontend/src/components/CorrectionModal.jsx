import React, { useState, useEffect, useRef } from 'react'


export default function CorrectionModal({ open, onClose, mode='treatment', targetWord, onSuccess, onLogAttempt, hintFn }){
const [attempt, setAttempt] = useState('')
const [feedback, setFeedback] = useState(null)
const [attemptCount, setAttemptCount] = useState(0)
const [hintsRevealed, setHintsRevealed] = useState(0)
const [revealedLetters, setRevealedLetters] = useState([])
const [explanation, setExplanation] = useState('')
const [isComplete, setIsComplete] = useState(false)
const [startTime] = useState(Date.now())
const inputRef = useRef(null)


// Reset state when modal opens/closes
useEffect(() => {
  if (open) {
    setAttempt('')
    setFeedback(null)
    setAttemptCount(0)
    setHintsRevealed(0)
    setRevealedLetters([])
    setExplanation('')
    setIsComplete(false)
    // Focus input after a short delay to ensure modal is rendered
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }
}, [open, targetWord])

if (!open) return null


// Enhanced Wordle-style comparison with better feedback
function compare(word, guess){
  const wordLower = word.toLowerCase()
  const guessLower = guess.toLowerCase()
  const result = []
  const wordChars = wordLower.split('')
  const guessChars = guessLower.split('')
  const maxLength = Math.max(word.length, guess.length)
  
  for (let i = 0; i < maxLength; i++) {
    const correctChar = wordChars[i] || ''
    const guessChar = guessChars[i] || ''
    
    if (!guessChar) {
      result.push({ char: '_', status: 'missing' })
    } else if (correctChar === guessChar) {
      result.push({ char: guessChar, status: 'correct' })
    } else if (wordLower.includes(guessChar)) {
      result.push({ char: guessChar, status: 'present' })
    } else {
      result.push({ char: guessChar, status: 'absent' })
    }
  }
  
  return result
}

// Progressive hint function
function getProgressiveHint(word, hintsRevealed) {
  const hints = [
    `The word has ${word.length} letters`,
    `The word starts with "${word[0].toUpperCase()}"`
  ]
  
  // Add letter-by-letter reveals
  for (let i = 0; i < word.length; i++) {
    if (i === 0) continue // Already revealed first letter
    hints.push(`Letter ${i + 1} is "${word[i].toUpperCase()}"`)
  }
  
  return hintsRevealed < hints.length ? hints[hintsRevealed] : null
}


async function submitAttempt(){
  if (!attempt.trim()) return
  
  const newAttemptCount = attemptCount + 1
  setAttemptCount(newAttemptCount)
  
  const comparisonResult = compare(targetWord, attempt)
  setFeedback(comparisonResult)
  
  // Log the attempt with behavioral data
  await onLogAttempt({
    attempt,
    attemptNumber: newAttemptCount,
    hintsUsed: hintsRevealed,
    timeSpent: (Date.now() - startTime) / 1000,
    isCorrect: attempt.toLowerCase().trim() === targetWord.toLowerCase().trim()
  })
  
  // Check if correct
  if (attempt.toLowerCase().trim() === targetWord.toLowerCase().trim()) {
    setIsComplete(true)
    
    // In treatment mode, require explanation before completion
    if (mode === 'treatment') {
      // Don't close immediately - require explanation first
      return
    } else {
      // Control mode - complete immediately
      onSuccess(attempt)
      onClose()
    }
  }
  
  // Clear input for next attempt (only if not correct)
  if (attempt.toLowerCase().trim() !== targetWord.toLowerCase().trim()) {
    setAttempt('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }
}

// Handle hint reveal
async function revealHint() {
  const hint = getProgressiveHint(targetWord, hintsRevealed)
  if (!hint) {
    alert('No more hints available!')
    return
  }
  
  const newHintsRevealed = hintsRevealed + 1
  setHintsRevealed(newHintsRevealed)
  
  // Log hint usage for behavioral analysis
  await onLogAttempt({
    attempt: `HINT_REVEALED_${newHintsRevealed}`,
    attemptNumber: attemptCount,
    hintsUsed: newHintsRevealed,
    timeSpent: (Date.now() - startTime) / 1000,
    hintContent: hint
  })
  
  alert(`Hint ${newHintsRevealed}: ${hint}`)
}

// Handle completion with explanation (treatment mode)
function handleCompleteWithExplanation() {
  if (!explanation.trim()) {
    alert('Please provide a brief explanation before continuing.')
    return
  }
  
  // Log the explanation
  onLogAttempt({
    attempt: `EXPLANATION: ${explanation}`,
    attemptNumber: attemptCount,
    hintsUsed: hintsRevealed,
    timeSpent: (Date.now() - startTime) / 1000,
    explanation: explanation
  })
  
  onSuccess(attempt)
  onClose()
}


return (
    <div className="modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modalInner" style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
          Word Learning {mode === 'control' ? '(Study Mode)' : '(Generation Mode)'}
        </h3>
        
        {/* Progress indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>Attempts: {attemptCount}</span>
          <span>Hints used: {hintsRevealed}</span>
          <span>Time: {Math.floor((Date.now() - startTime) / 1000)}s</span>
        </div>
        
        {mode === 'control' ? (
          /* CONTROL CONDITION: Show answer immediately */
          <div>
            <div style={{
              padding: '16px',
              backgroundColor: '#e8f5e8',
              borderRadius: '6px',
              marginBottom: '16px',
              border: '2px solid #4CAF50'
            }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#2e7d32' }}>
                The correct word is: <span style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{targetWord}</span>
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                Please study this word and its spelling.
              </p>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Optional explanation (helps with learning):
              </label>
              <textarea 
                className="input" 
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="Why do you think this word makes sense here? (optional)"
                style={{ minHeight: '80px', width: '100%', marginBottom: '16px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button 
                className="button" 
                onClick={() => {
                  if (explanation.trim()) {
                    onLogAttempt({
                      attempt: targetWord,
                      explanation: explanation,
                      mode: 'control',
                      timeSpent: (Date.now() - startTime) / 1000
                    })
                  }
                  onSuccess(targetWord)
                  onClose()
                }}
                style={{ backgroundColor: '#4CAF50', color: 'white' }}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          /* TREATMENT CONDITION: Generation with progressive hints */
          <div>
            {!isComplete ? (
              /* Generation phase */
              <div>
                <p style={{ marginBottom: '16px', fontSize: '16px' }}>
                  Try to generate the correct word. You'll get letter-by-letter feedback.
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    Your guess:
                  </label>
                  <input 
                    ref={inputRef}
                    className="input" 
                    value={attempt} 
                    onChange={e => setAttempt(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        submitAttempt()
                      }
                    }}
                    placeholder="Type your guess..."
                    style={{ 
                      fontSize: '16px', 
                      padding: '12px',
                      width: '100%',
                      marginBottom: '8px'
                    }}
                  />
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="button" 
                      onClick={submitAttempt}
                      disabled={!attempt.trim()}
                      style={{ 
                        backgroundColor: attempt.trim() ? '#2196F3' : '#ddd',
                        color: 'white'
                      }}
                    >
                      Submit Guess
                    </button>
                    
                    <button 
                      className="button" 
                      onClick={revealHint}
                      style={{ backgroundColor: '#FF9800', color: 'white' }}
                    >
                      Get Hint ({hintsRevealed} used)
                    </button>
                  </div>
                </div>
                
                {/* Feedback display */}
                {feedback && feedback.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Letter Feedback:</p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {feedback.map((item, index) => (
                        <span 
                          key={index} 
                          style={{
                            padding: '8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            minWidth: '30px',
                            textAlign: 'center',
                            backgroundColor: 
                              item.status === 'correct' ? '#4CAF50' :
                              item.status === 'present' ? '#FF9800' :
                              item.status === 'absent' ? '#757575' : '#f5f5f5',
                            color: item.status === 'missing' ? '#333' : 'white'
                          }}
                        >
                          {item.char === '_' ? '?' : item.char.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
                      🟢 Correct position • 🟡 Wrong position • ⚫ Not in word
                    </div>
                  </div>
                )}
                
                {attemptCount >= 3 && !isComplete && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#e65100'
                  }}>
                    💡 <strong>Tip:</strong> Use the hint button if you're stuck! You can also try different letter combinations.
                  </div>
                )}
              </div>
            ) : (
              /* Explanation phase (after correct guess) */
              <div>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#e8f5e8',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  border: '2px solid #4CAF50'
                }}>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#2e7d32' }}>
                    ✅ Correct! The word is: <span style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{targetWord}</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                    Great job generating the correct word!
                  </p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    <span style={{ color: '#d32f2f' }}>*</span> Brief explanation required:
                  </label>
                  <textarea 
                    className="input" 
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                    placeholder="Why does this word make sense in this context? What helped you figure it out?"
                    style={{ minHeight: '100px', width: '100%' }}
                    autoFocus
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    This explanation helps consolidate your learning.
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button 
                    className="button" 
                    onClick={handleCompleteWithExplanation}
                    disabled={!explanation.trim()}
                    style={{ 
                      backgroundColor: explanation.trim() ? '#4CAF50' : '#ddd',
                      color: 'white'
                    }}
                  >
                    Complete Learning
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '16px',
            padding: '8px',
            backgroundColor: '#f5f5f5',
            fontSize: '11px',
            color: '#666',
            borderRadius: '4px'
          }}>
            Debug: Target="{targetWord}" | Mode={mode} | Complete={isComplete.toString()}
          </div>
        )}
      </div>
    </div>
  )
}