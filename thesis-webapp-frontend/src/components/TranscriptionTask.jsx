import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

export default function TranscriptionTask({ 
  stimulus, 
  participantId, 
  experimentId,
  onComplete,
  onSkip 
}) {
  const { t } = useTranslation()
  const [transcription, setTranscription] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [keystrokes, setKeystrokes] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const audioRef = useRef(null)
  const textareaRef = useRef(null)

  // Get the locale for proper text selection
  const locale = localStorage.getItem('locale') || 'en'
  
  // Get the full story text for comparison
  const getFullStoryText = () => {
    if (!stimulus || !stimulus.paragraphs) return ''
    
    return stimulus.paragraphs.map(p => {
      const text = typeof p.text === 'string' ? p.text : 
                  (p.text && (p.text[locale] || Object.values(p.text)[0])) || ''
      return text
    }).join(' ')
  }

  const fullStoryText = getFullStoryText()

  // Handle audio play/pause
  function handleAudioToggle() {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
      setPlayCount(prev => prev + 1)
    }
    setIsPlaying(!isPlaying)
  }

  // Track keystrokes for behavioral analysis
  function handleTextChange(e) {
    setTranscription(e.target.value)
    setKeystrokes(prev => prev + 1)
    
    // Log keystroke event for behavioral analysis
    logEvent('keystroke', {
      currentLength: e.target.value.length,
      keystrokeCount: keystrokes + 1,
      timeElapsed: Date.now() - startTime
    })
  }

  // Audio event handlers
  function handleAudioPlay() {
    setIsPlaying(true)
    logEvent('audio_play', {
      playCount: playCount + 1,
      timeElapsed: Date.now() - startTime
    })
  }

  function handleAudioPause() {
    setIsPlaying(false)
    logEvent('audio_pause', {
      playCount,
      timeElapsed: Date.now() - startTime
    })
  }

  function handleAudioEnded() {
    setIsPlaying(false)
    logEvent('audio_ended', {
      playCount,
      timeElapsed: Date.now() - startTime
    })
  }

  // Log behavioral events
  async function logEvent(eventType, payload) {
    try {
      await api.submitAttempt({
        participantId,
        experimentId,
        storyId: stimulus?.storyId || 'unknown',
        paragraphIndex: 0,
        blankIndex: -1, // Special value for transcription events
        attemptText: eventType,
        attemptNumber: 1,
        timeOnBlankSeconds: (Date.now() - startTime) / 1000,
        locale,
        metadata: { 
          eventType: `transcription_${eventType}`,
          ...payload 
        }
      })
    } catch (error) {
      console.error('Error logging transcription event:', error)
    }
  }

  // Submit transcription
  async function handleSubmit() {
    if (!transcription.trim()) {
      alert('Please enter a transcription before submitting.')
      return
    }

    setSubmitting(true)
    
    try {
      // Calculate time spent
      const timeSpentSeconds = (Date.now() - startTime) / 1000
      
      // Submit the transcription result
      await api.submitResult({
        participantId,
        experimentId,
        itemId: `${stimulus?.storyId || 'unknown'}-transcription`,
        phase: 'immediate_transcription',
        response: transcription,
        correct: fullStoryText,
        metadata: {
          taskType: 'transcription',
          audioPlaysCount: playCount,
          keystrokesCount: keystrokes,
          timeSpentSeconds,
          wordCount: transcription.trim().split(/\s+/).length,
          characterCount: transcription.length
        }
      })

      // Log completion event
      await logEvent('task_completed', {
        timeSpentSeconds,
        audioPlaysCount: playCount,
        keystrokesCount: keystrokes,
        finalLength: transcription.length
      })

      onComplete && onComplete({
        transcription,
        timeSpentSeconds,
        audioPlaysCount: playCount,
        keystrokesCount: keystrokes
      })
      
    } catch (error) {
      console.error('Error submitting transcription:', error)
      alert('Error submitting transcription. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Get audio URL - prioritize full story audio
  const audioUrl = stimulus?.fullAudioUrl || 
                  (stimulus?.paragraphs?.[0]?.audioUrl) || 
                  stimulus?.titleAudio

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px'
    }}>
      <h2 style={{ marginBottom: '16px', color: '#333' }}>
        Transcription Task
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '12px' }}>
          Please listen to the audio story and type what you hear as accurately as possible. 
          You can replay the audio as many times as needed.
        </p>
        
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '14px',
          color: '#1976d2'
        }}>
          <strong>Instructions:</strong> Try to capture the exact words and phrases you hear. 
          Don't worry about perfect spelling - focus on getting the content down.
        </div>
      </div>

      {/* Audio Controls */}
      {audioUrl && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #ddd'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '8px'
          }}>
            <span style={{ fontWeight: 'bold' }}>🎧 Story Audio:</span>
            <button 
              onClick={handleAudioToggle}
              className="button"
              style={{ 
                backgroundColor: isPlaying ? '#ff5722' : '#4CAF50',
                color: 'white',
                padding: '8px 16px'
              }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <span style={{ fontSize: '14px', color: '#666' }}>
              Played {playCount} times
            </span>
          </div>
          
          <audio
            ref={audioRef}
            onPlay={handleAudioPlay}
            onPause={handleAudioPause}
            onEnded={handleAudioEnded}
            preload="metadata"
            style={{ width: '100%', height: '40px' }}
          >
            <source src={audioUrl} type="audio/wav" />
            <source src={audioUrl} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Transcription Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontWeight: 'bold', 
          marginBottom: '8px' 
        }}>
          Your Transcription:
        </label>
        
        <textarea
          ref={textareaRef}
          value={transcription}
          onChange={handleTextChange}
          placeholder="Start typing what you hear..."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px',
            borderRadius: '4px',
            border: '2px solid #ddd',
            fontSize: '16px',
            lineHeight: '1.5',
            fontFamily: 'Arial, sans-serif',
            resize: 'vertical'
          }}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>Characters: {transcription.length}</span>
          <span>Words: {transcription.trim() ? transcription.trim().split(/\s+/).length : 0}</span>
          <span>Keystrokes: {keystrokes}</span>
        </div>
      </div>

      {/* Submit Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        {onSkip && (
          <button 
            onClick={onSkip}
            disabled={submitting}
            className="button"
            style={{ backgroundColor: '#f5f5f5', color: '#333' }}
          >
            Skip Transcription
          </button>
        )}
        
        <button 
          onClick={handleSubmit}
          disabled={submitting || !transcription.trim()}
          className="button"
          style={{ 
            backgroundColor: transcription.trim() ? '#4CAF50' : '#ddd',
            color: 'white',
            padding: '12px 24px',
            fontSize: '16px',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Transcription'}
        </button>
      </div>

      {/* Progress Indicator */}
      <div style={{ 
        marginTop: '16px',
        padding: '8px',
        backgroundColor: '#fff3e0',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#e65100'
      }}>
        Time elapsed: {Math.floor((Date.now() - startTime) / 1000)} seconds | 
        Audio plays: {playCount} | 
        Keystrokes: {keystrokes}
      </div>
    </div>
  )
}
