import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function PaasMentalEffortScale({ 
  phase = 'mid-task', // 'mid-task' or 'post-task'
  onSubmit, 
  onSkip,
  participantId,
  experimentId 
}) {
  const { t } = useTranslation()
  const [selectedRating, setSelectedRating] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const paasLabels = {
    1: "Very, very low mental effort",
    2: "Very low mental effort", 
    3: "Low mental effort",
    4: "Rather low mental effort",
    5: "Neither low nor high mental effort",
    6: "Rather high mental effort",
    7: "High mental effort",
    8: "Very high mental effort",
    9: "Very, very high mental effort"
  }

  const phaseInstructions = {
    'mid-task': 'How much mental effort are you investing in this learning task right now?',
    'post-task': 'How much mental effort did you invest in the learning task you just completed?'
  }

  async function handleSubmit() {
    if (selectedRating === null) {
      alert('Please select a rating before continuing.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        participantId,
        experimentId,
        phase,
        score: selectedRating,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error submitting Paas rating:', error)
      alert('Error submitting rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="paas-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginTop: 0 }}>Mental Effort Assessment</h3>
        
        <p style={{ marginBottom: '20px', fontSize: '16px' }}>
          {phaseInstructions[phase]}
        </p>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>
            Please select the rating that best describes your experience:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(paasLabels).map(([rating, label]) => (
              <label 
                key={rating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  border: selectedRating === parseInt(rating) ? '2px solid #4CAF50' : '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedRating === parseInt(rating) ? '#f8fff8' : 'white'
                }}
                onClick={() => setSelectedRating(parseInt(rating))}
              >
                <input
                  type="radio"
                  name="paas-rating"
                  value={rating}
                  checked={selectedRating === parseInt(rating)}
                  onChange={() => setSelectedRating(parseInt(rating))}
                  style={{ margin: 0 }}
                />
                <span style={{ fontWeight: 'bold', minWidth: '20px' }}>
                  {rating}
                </span>
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {onSkip && (
            <button 
              className="button" 
              onClick={onSkip}
              disabled={submitting}
              style={{ backgroundColor: '#f5f5f5', color: '#333' }}
            >
              Skip
            </button>
          )}
          <button 
            className="button" 
            onClick={handleSubmit}
            disabled={submitting || selectedRating === null}
            style={{ 
              backgroundColor: selectedRating !== null ? '#4CAF50' : '#ddd',
              opacity: submitting ? 0.7 : 1 
            }}
          >
            {submitting ? 'Submitting...' : 'Continue'}
          </button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
          <p>
            <strong>Note:</strong> Mental effort refers to the cognitive capacity that is allocated 
            to accommodate the demands imposed by the task. This is different from task difficulty 
            or time spent - it's about how hard you had to think.
          </p>
        </div>
      </div>
    </div>
  )
}
