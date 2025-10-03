import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import GapFill from './GapFill'
import TranscriptionTask from '../components/TranscriptionTask'
import PaasMentalEffortScale from '../components/PaasMentalEffortScale'
import PriorKnowledgeAssessment from '../components/PriorKnowledgeAssessment'

export default function ExperimentFlow() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Extract URL parameters
  const experimentId = searchParams.get('experimentId') || '507f1f77bcf86cd799439011'
  const mode = searchParams.get('mode') || 'treatment'
  
  // Task flow state
  const [currentTask, setCurrentTask] = useState('baseline') // 'baseline', 'gapfill', 'transcription', 'complete'
  const [stimulus, setStimulus] = useState(null)
  const [baselineResults, setBaselineResults] = useState(null)
  const [gapFillResults, setGapFillResults] = useState(null)
  const [showTranscriptionPaas, setShowTranscriptionPaas] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Participant data
  const participantId = localStorage.getItem('participantId')
  const locale = localStorage.getItem('locale') || 'en'
  
  // Load stimulus data on mount
  useEffect(() => {
    if (!experimentId) return
    
    setLoading(true)
    api.fetchStimuli(experimentId, locale)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStimulus(data[0])
        } else {
          setStimulus(null)
        }
      })
      .catch(err => {
        console.error('Error loading stimuli:', err)
        setStimulus(null)
      })
      .finally(() => setLoading(false))
  }, [experimentId, locale])
  
  // Handle baseline assessment completion
  function handleBaselineComplete(results) {
    setBaselineResults(results)
    setCurrentTask('gapfill')
  }
  
  // Skip baseline assessment
  function handleSkipBaseline() {
    setCurrentTask('gapfill')
  }
  
  // Handle gap-fill completion (called when post-task Paas is submitted)
  function handleGapFillComplete(results) {
    setGapFillResults(results)
    setCurrentTask('transcription')
  }
  
  // Handle transcription completion
  function handleTranscriptionComplete(results) {
    // Show post-transcription Paas assessment
    setShowTranscriptionPaas(true)
  }
  
  // Handle transcription Paas completion
  async function handleTranscriptionPaasComplete(paasData) {
    try {
      await api.submitPaas(paasData)
      setShowTranscriptionPaas(false)
      
      // Generate delayed recall link when experiment is complete
      await generateDelayedRecallLink()
      
      setCurrentTask('complete')
    } catch (error) {
      console.error('Error submitting transcription Paas:', error)
      throw error
    }
  }
  
  // Generate delayed recall link for participant
  async function generateDelayedRecallLink() {
    try {
      const response = await api.generateDelayedRecallLink({
        participantId,
        experimentId,
        delayHours: 48 // 48 hours delay
      })
      
      console.log('Delayed recall link generated:', response.delayedRecallUrl)
      
      // Store the link info in local storage for reference
      localStorage.setItem('delayedRecallInfo', JSON.stringify({
        url: response.delayedRecallUrl,
        scheduledTime: response.scheduledTime,
        generated: new Date().toISOString()
      }))
      
      return response
    } catch (error) {
      console.error('Error generating delayed recall link:', error)
      // Don't throw - experiment should complete even if link generation fails
    }
  }
  
  // Skip transcription task
  function handleSkipTranscription() {
    setCurrentTask('complete')
  }
  
  // Handle final completion
  function handleExperimentComplete() {
    // Show completion message and redirect options
    alert(t('experiment_complete') || 'Experiment completed! Thank you for your participation.')
    
    // Optional: redirect to completion page or dashboard
    navigate('/student/dashboard')
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Loading Experiment...</h2>
        <div style={{ marginTop: '20px', color: '#666' }}>
          Please wait while we prepare your tasks.
        </div>
      </div>
    )
  }
  
  // Error state
  if (!experimentId) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#d32f2f' }}>Missing Experiment ID</h2>
          <p>Please provide an experiment ID in the URL.</p>
          <button 
            className="button" 
            onClick={() => navigate('/')}
            style={{ marginTop: '20px' }}
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }
  
  if (!stimulus) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#d32f2f' }}>No Content Available</h2>
          <p>No experimental content found for this experiment and language.</p>
          <button 
            className="button" 
            onClick={() => navigate('/')}
            style={{ marginTop: '20px' }}
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }
  
  // Render current task
  return (
    <div>
      {/* Task Progress Indicator */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '12px 20px',
        borderBottom: '1px solid #ddd',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>Cognitive Learning Study</h3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px'
          }}>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px',
              backgroundColor: currentTask === 'baseline' ? '#4CAF50' : (baselineResults ? '#81C784' : '#ddd'),
              color: (currentTask === 'baseline' || baselineResults) ? 'white' : '#666'
            }}>
              1. Baseline
            </span>
            <span>→</span>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px',
              backgroundColor: currentTask === 'gapfill' ? '#4CAF50' : (gapFillResults ? '#81C784' : '#ddd'),
              color: (currentTask === 'gapfill' || gapFillResults) ? 'white' : '#666'
            }}>
              2. Gap-Fill
            </span>
            <span>→</span>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px',
              backgroundColor: currentTask === 'transcription' ? '#4CAF50' : '#ddd',
              color: currentTask === 'transcription' ? 'white' : '#666'
            }}>
              3. Transcription
            </span>
            <span>→</span>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px',
              backgroundColor: currentTask === 'complete' ? '#4CAF50' : '#ddd',
              color: currentTask === 'complete' ? 'white' : '#666'
            }}>
              4. Complete
            </span>
          </div>
          
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
            Mode: {mode} | ID: {participantId?.slice(-8)}
          </div>
        </div>
      </div>
      
      {/* Task Content */}
      <div style={{ minHeight: 'calc(100vh - 80px)' }}>
        {currentTask === 'baseline' && (
          <div className="container">
            <PriorKnowledgeAssessment
              stimulus={stimulus}
              participantId={participantId}
              experimentId={experimentId}
              onComplete={handleBaselineComplete}
              onSkip={handleSkipBaseline}
            />
          </div>
        )}
        
        {currentTask === 'gapfill' && (
          <GapFillWithCallback 
            experimentId={experimentId}
            mode={mode}
            onComplete={handleGapFillComplete}
          />
        )}
        
        {currentTask === 'transcription' && (
          <div className="container">
            <TranscriptionTask
              stimulus={stimulus}
              participantId={participantId}
              experimentId={experimentId}
              onComplete={handleTranscriptionComplete}
              onSkip={handleSkipTranscription}
            />
            
            {/* Post-transcription Paas assessment */}
            {showTranscriptionPaas && (
              <PaasMentalEffortScale
                phase="post-transcription"
                participantId={participantId}
                experimentId={experimentId}
                onSubmit={handleTranscriptionPaasComplete}
              />
            )}
          </div>
        )}
        
        {currentTask === 'complete' && (
          <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
            <h2 style={{ color: '#4CAF50', marginBottom: '20px' }}>
              🎉 Experiment Complete!
            </h2>
            
            <div style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              backgroundColor: '#f9f9f9',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '30px'
            }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>What's Next?</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
                Thank you for completing the learning tasks! You will receive a follow-up 
                assessment in 48-72 hours to test your delayed recall. Please check your 
                email for instructions.
              </p>
              
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                padding: '12px', 
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                <strong>Important:</strong> Your participation helps us understand how 
                different learning methods affect memory and cognitive effort. Your data 
                contributes valuable insights to educational research.
              </div>
              
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p><strong>Session Summary:</strong></p>
                <p>• {baselineResults ? 'Prior knowledge baseline completed' : 'Baseline assessment skipped'}</p>
                <p>• Gap-fill task completed</p>
                <p>• Transcription task completed</p>
                <p>• Mental effort assessments submitted</p>
                <p>• Delayed recall scheduled</p>
                {baselineResults && (
                  <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
                    Assessed {baselineResults.wordsAssessed} words in {Math.floor(baselineResults.totalTime)}s
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="button"
                onClick={() => navigate('/student/dashboard')}
                style={{ 
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '12px 24px'
                }}
              >
                Return to Dashboard
              </button>
              
              <button 
                className="button"
                onClick={() => navigate('/')}
                style={{ backgroundColor: '#f5f5f5', color: '#333' }}
              >
                Return Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Wrapper component for GapFill that handles completion callback
 // We need to modify the original GapFill to accept an onComplete callback
  // For now, we'll use the existing GapFill component
  // In a production setup, you'd modify GapFill to call onComplete when done
  
