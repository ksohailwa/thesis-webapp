import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import CorrectionModal from '../components/CorrectionModal'
import PaasMentalEffortScale from '../components/PaasMentalEffortScale'

// Helper: safely replace target words with placeholders and return mapping
function replaceTargetsWithBlanks(text, targets){
  let idx = 0
  const map = []
  // Do case-insensitive whole-word replacement
  const replaced = targets.reduce((acc, word) => {
    if (!word) return acc
    const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&') + '\\b', 'gi')
    return acc.replace(re, () => {
      map.push(word)
      const placeholder = `[[BLANK_${idx}]]`
      idx++
      return placeholder
    })
  }, text)
  const parts = replaced.split(/(\[\[BLANK_\d+\]\])/)
  return { parts, map }
}

export default function GapFill({ experimentId, mode='treatment' }){
  const { t } = useTranslation()
  const [stimulus, setStimulus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [modalState, setModalState] = useState({ open:false, targetWord:'', blankIndex:0 })
  const [paasState, setPaasState] = useState({ showMidTask: false, showPostTask: false, completedMidTask: false })
  const [taskStartTime] = useState(Date.now())
  const [blanksCompleted, setBlanksCompleted] = useState(0)
  const participantId = localStorage.getItem('participantId')
  const locale = localStorage.getItem('locale') || 'en'

  useEffect(() => {
    if (!experimentId) return
    setLoading(true)
    api.fetchStimuli(experimentId, locale)
      .then(data => {
        // Expect array; pick first for demo
        if (Array.isArray(data) && data.length > 0) setStimulus(data[0])
        else setStimulus(null)
      })
      .catch(err => {
        console.error('fetchStimuli error', err)
        setStimulus(null)
      })
      .finally(() => setLoading(false))
  }, [experimentId, locale])

  if (!experimentId) return <div className="container">No experimentId provided. Add ?experimentId=YOUR_ID to URL.</div>
  if (loading) return <div className="container">Loading...</div>
  if (!stimulus) return <div className="container">No stimuli found for this experiment and language.</div>

  // Build target list robustly (handles {en:..,de:..} word object)
  const targets = Array.isArray(stimulus.target_words)
    ? stimulus.target_words.map(tw => {
        if (!tw || !tw.word) return ''
        if (typeof tw.word === 'string') return tw.word
        return tw.word[locale] || Object.values(tw.word)[0] || ''
      })
    : []

  // Get paragraph text (handle text that may be language-tagged object)
  const paragraphRaw = stimulus.paragraphs && stimulus.paragraphs[0] ? stimulus.paragraphs[0].text : ''
  const paragraph = typeof paragraphRaw === 'string' ? paragraphRaw
    : (paragraphRaw && (paragraphRaw[locale] || Object.values(paragraphRaw)[0])) || ''

  const { parts, map } = replaceTargetsWithBlanks(paragraph, targets)
  
  // Trigger mid-task Paas assessment at 50% completion
  useEffect(() => {
    const completedCount = Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length
    const completionPercentage = map.length > 0 ? (completedCount / map.length) : 0
    
    if (completionPercentage >= 0.5 && !paasState.completedMidTask && !paasState.showMidTask && completedCount > blanksCompleted) {
      setPaasState(prev => ({ ...prev, showMidTask: true }))
    }
    setBlanksCompleted(completedCount)
  }, [answers, map.length, paasState.completedMidTask, paasState.showMidTask, blanksCompleted])

  async function onAttemptSubmit(blankIndex){
    const val = answers[blankIndex] || ''
    try {
      await api.submitAttempt({
        participantId,
        experimentId,
        storyId: stimulus.storyId,
        paragraphIndex: 0,
        blankIndex,
        attemptText: val,
        attemptNumber: 1,
        timeOnBlankSeconds: 10,
        locale
      })
      // quick UX feedback
      alert('Attempt logged')
    } catch (err) {
      console.error('submitAttempt error', err)
      alert('Error logging attempt')
    }
  }

  function openCorrection(blankIndex){
    const target = map[blankIndex] || ''
    setModalState({ open:true, targetWord: target, blankIndex })
  }

  async function logAttemptAndMaybeClose(attemptData){
    try {
      // Handle both string and object formats for backward compatibility
      const attemptText = typeof attemptData === 'string' ? attemptData : attemptData.attempt || ''
      const metadata = typeof attemptData === 'object' ? attemptData : {}
      
      await api.submitAttempt({
        participantId,
        experimentId,
        storyId: stimulus.storyId,
        paragraphIndex: 0,
        blankIndex: modalState.blankIndex,
        attemptText: attemptText,
        attemptNumber: metadata.attemptNumber || 1,
        timeOnBlankSeconds: metadata.timeSpent || 5,
        locale,
        metadata: {
          hintsUsed: metadata.hintsUsed || 0,
          isCorrect: metadata.isCorrect || false,
          explanation: metadata.explanation || '',
          mode: metadata.mode || 'unknown',
          hintContent: metadata.hintContent || '',
          ...metadata
        }
      })
    } catch (err) {
      console.error('logAttempt error', err)
    }
  }

  async function hintFn(){
    // example: we send a small state; server will decide if hint allowed
    try {
      const attemptCount = 2
      const firstAttemptAt = new Date().toISOString()
      const res = await api.revealHint({
        participantId,
        experimentId,
        storyId: stimulus.storyId,
        targetWordIndex: modalState.blankIndex,
        attemptCount,
        firstAttemptAt,
        hint_rules: { min_attempts_before_hint:3, time_before_auto_hint_seconds:120 }
      })
      return res
    } catch (err) {
      console.error('hintFn error', err)
      return { allowed:false }
    }
  }

  async function handlePaasSubmission(paasData) {
    try {
      await api.submitPaas(paasData)
      if (paasData.phase === 'mid-task') {
        setPaasState(prev => ({ ...prev, showMidTask: false, completedMidTask: true }))
      } else if (paasData.phase === 'post-task') {
        setPaasState(prev => ({ ...prev, showPostTask: false }))
        // Show thank you message after post-task Paas
        alert(t('thank_you'))
      }
    } catch (error) {
      console.error('Error submitting Paas rating:', error)
      throw error
    }
  }

  async function finalize(){
    try {
      // First submit all results
      for (let i=0;i<map.length;i++){
        const userResp = answers[i] || ''
        const correct = map[i] || ''
        await api.submitResult({
          participantId,
          experimentId,
          itemId: `${stimulus.storyId}-t${i}`,
          phase: 'immediate',
          response: userResp,
          correct
        })
      }
      // Then show post-task Paas assessment
      setPaasState(prev => ({ ...prev, showPostTask: true }))
    } catch (err) {
      console.error('finalize error', err)
      alert('Error submitting results')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h2>{stimulus.title && (typeof stimulus.title === 'string' ? stimulus.title : (stimulus.title[locale] || Object.values(stimulus.title)[0]))}</h2>
        <div className="progress-info">
          <small className="small">Mode: {mode} | Progress: {Object.keys(answers).length}/{map.length} completed</small>
        </div>
        {/* Audio controls for story */}
        {(stimulus.titleAudio || stimulus.fullAudioUrl) && (
          <div className="audio-controls">
            {stimulus.titleAudio && (
              <div className="audio-item">
                <label>🎵 Title Audio:</label>
                <audio controls preload="metadata">
                  <source src={stimulus.titleAudio} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            {stimulus.fullAudioUrl && (
              <div className="audio-item">
                <label>📻 Full Story Audio:</label>
                <audio controls preload="metadata">
                  <source src={stimulus.fullAudioUrl} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="story-content">
        {/* Individual paragraph audio controls */}
        {stimulus.paragraphs && stimulus.paragraphs[0] && stimulus.paragraphs[0].audioUrl && (
          <div className="paragraph-audio">
            <label>🎧 Paragraph Audio:</label>
            <audio controls preload="metadata">
              <source src={stimulus.paragraphs[0].audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        
        <p className="paragraph">
          {parts.map((part, idx) => {
            const match = part.match(/^\[\[BLANK_(\d+)\]\]$/)
            if (match){
              const bi = Number(match[1])
              const isCompleted = answers[bi] && answers[bi].trim() !== ''
              return (
                <span key={idx} className="blank" style={{display: 'inline-block', margin: '0 4px', verticalAlign: 'middle'}}>
                  <div style={{display:'flex', flexDirection:'column', gap:4, minWidth: 150}}>
                    <input 
                      className="input" 
                      placeholder="Type here..." 
                      value={answers[bi]||''} 
                      onChange={e => setAnswers({...answers, [bi]: e.target.value})}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: isCompleted ? '2px solid #4CAF50' : '2px solid #ddd',
                        backgroundColor: isCompleted ? '#f8fff8' : '#fff'
                      }}
                    />
                    <div style={{display:'flex',gap:4, fontSize: '12px'}}>
                      <button 
                        className="button" 
                        onClick={() => onAttemptSubmit(bi)}
                        disabled={!answers[bi] || answers[bi].trim() === ''}
                        style={{fontSize: '11px', padding: '4px 8px'}}
                      >
                        Check
                      </button>
                      <button 
                        className="button" 
                        onClick={() => openCorrection(bi)}
                        style={{fontSize: '11px', padding: '4px 8px'}}
                      >
                        Help
                      </button>
                    </div>
                  </div>
                </span>
              )
            }
            return <span key={idx}>{part}</span>
          })}
        </p>
      </div>

      <div style={{marginTop:12}}>
        <button className="button" onClick={finalize}>{t('submit')}</button>
      </div>

      <CorrectionModal
        open={modalState.open}
        onClose={() => setModalState({...modalState, open:false})}
        mode={mode}
        targetWord={modalState.targetWord}
        onSuccess={(val) => { setAnswers({...answers, [modalState.blankIndex]: val}) }}
        onLogAttempt={logAttemptAndMaybeClose}
        hintFn={hintFn}
      />
      
      {paasState.showMidTask && (
        <PaasMentalEffortScale
          phase="mid-task"
          participantId={participantId}
          experimentId={experimentId}
          onSubmit={handlePaasSubmission}
        />
      )}
      
      {paasState.showPostTask && (
        <PaasMentalEffortScale
          phase="post-task"
          participantId={participantId}
          experimentId={experimentId}
          onSubmit={handlePaasSubmission}
        />
      )}
    </div>
  )
}
