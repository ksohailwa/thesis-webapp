import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function BehavioralAnalyticsDashboard({ experimentId }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('24h') // 1h, 6h, 24h, 7d, all
  const [selectedTab, setSelectedTab] = useState('overview') // overview, behavior, cognitive_load, completion

  useEffect(() => {
    loadAnalytics()
    // Set up auto-refresh every 30 seconds for real-time monitoring
    const interval = setInterval(loadAnalytics, 30000)
    return () => clearInterval(interval)
  }, [experimentId, timeRange])

  async function loadAnalytics() {
    try {
      if (!refreshing) setRefreshing(true)
      
      const response = await api.getExperimentAnalytics(experimentId)
      setAnalytics(response)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Calculate cognitive offloading metrics
  function calculateOffloadingMetrics(data) {
    if (!data?.events) return {}
    
    const hintEvents = data.events.filter(e => 
      e.eventType === 'hint_revealed' || 
      e.payload?.eventType?.includes('hint') ||
      e.payload?.hintContent
    )
    
    const audioReplays = data.events.filter(e => 
      e.eventType === 'audio_play' || 
      e.payload?.eventType?.includes('audio_play')
    )
    
    const modalTimeEvents = data.events.filter(e => 
      e.payload?.eventType?.includes('modal') ||
      e.payload?.timeSpent
    )
    
    return {
      totalHintsRequested: hintEvents.length,
      avgHintsPerParticipant: data.totalParticipants > 0 ? 
        (hintEvents.length / data.totalParticipants).toFixed(2) : 0,
      totalAudioReplays: audioReplays.length,
      avgAudioReplaysPerParticipant: data.totalParticipants > 0 ? 
        (audioReplays.length / data.totalParticipants).toFixed(2) : 0,
      avgModalTime: modalTimeEvents.length > 0 ?
        (modalTimeEvents.reduce((sum, e) => sum + (e.payload?.timeSpent || 0), 0) / modalTimeEvents.length).toFixed(1) : 0
    }
  }

  // Calculate cognitive load metrics from Paas data
  function calculateCognitiveLoadMetrics(data) {
    if (!data?.events) return {}
    
    const paasEvents = data.events.filter(e => e.eventType === 'paas_submit')
    
    const midTaskRatings = paasEvents.filter(e => e.payload?.phase === 'mid-task').map(e => e.payload.score)
    const postTaskRatings = paasEvents.filter(e => e.payload?.phase === 'post-task').map(e => e.payload.score)
    
    return {
      avgMidTaskEffort: midTaskRatings.length > 0 ? 
        (midTaskRatings.reduce((a, b) => a + b, 0) / midTaskRatings.length).toFixed(1) : 0,
      avgPostTaskEffort: postTaskRatings.length > 0 ? 
        (postTaskRatings.reduce((a, b) => a + b, 0) / postTaskRatings.length).toFixed(1) : 0,
      totalPaasResponses: paasEvents.length,
      effortChangeScore: postTaskRatings.length > 0 && midTaskRatings.length > 0 ?
        ((postTaskRatings.reduce((a, b) => a + b, 0) / postTaskRatings.length) - 
         (midTaskRatings.reduce((a, b) => a + b, 0) / midTaskRatings.length)).toFixed(1) : 0
    }
  }

  // Calculate accuracy metrics
  function calculateAccuracyMetrics(data) {
    if (!data?.results) return {}
    
    const immediateResults = data.results.filter(r => r.phase === 'immediate_transcription')
    const delayedResults = data.results.filter(r => r.phase === 'delayed_recall')
    const baselineResults = data.results.filter(r => r.phase === 'baseline_knowledge')
    
    return {
      avgImmediateAccuracy: immediateResults.length > 0 ?
        (immediateResults.reduce((sum, r) => sum + (r.normalized_score || 0), 0) / immediateResults.length * 100).toFixed(1) : 0,
      avgDelayedAccuracy: delayedResults.length > 0 ?
        (delayedResults.reduce((sum, r) => sum + (r.normalized_score || 0), 0) / delayedResults.length * 100).toFixed(1) : 0,
      totalBaselineAssessments: baselineResults.length,
      completionRate: data.totalParticipants > 0 ?
        ((data.completedParticipants || 0) / data.totalParticipants * 100).toFixed(1) : 0
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Analytics...</h2>
        <p>Gathering behavioral data and cognitive metrics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No Data Available</h2>
        <p>No analytics data found for this experiment.</p>
        <button className="button" onClick={loadAnalytics}>
          Retry
        </button>
      </div>
    )
  }

  const offloadingMetrics = calculateOffloadingMetrics(analytics)
  const cognitiveLoadMetrics = calculateCognitiveLoadMetrics(analytics)
  const accuracyMetrics = calculateAccuracyMetrics(analytics)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Behavioral Analytics Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
            Real-time cognitive offloading and learning metrics
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Time Range Selector */}
          <select 
            value={timeRange} 
            onChange={e => setTimeRange(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
          
          <button
            onClick={loadAnalytics}
            disabled={refreshing}
            className="button"
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            {refreshing ? '⟳ Refreshing...' : '🔄 Refresh'}
          </button>
          
          <div style={{
            padding: '8px 12px',
            backgroundColor: refreshing ? '#fff3e0' : '#e8f5e8',
            borderRadius: '4px',
            fontSize: '12px',
            color: refreshing ? '#e65100' : '#2e7d32'
          }}>
            {refreshing ? 'Updating...' : `Updated ${new Date().toLocaleTimeString()}`}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'behavior', label: 'Cognitive Offloading', icon: '🧠' },
          { id: 'cognitive_load', label: 'Mental Effort', icon: '⚡' },
          { id: 'completion', label: 'Progress & Accuracy', icon: '✅' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: selectedTab === tab.id ? '#2196F3' : 'transparent',
              color: selectedTab === tab.id ? 'white' : '#666',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: selectedTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Participation Summary */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>📈 Participation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                  {analytics.totalParticipants || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Participants</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {accuracyMetrics.completionRate}%
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Completion Rate</div>
              </div>
            </div>
          </div>

          {/* Cognitive Load Summary */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>⚡ Mental Effort (Paas)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                  {cognitiveLoadMetrics.avgMidTaskEffort}/9
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Avg Mid-Task</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF5722' }}>
                  {cognitiveLoadMetrics.avgPostTaskEffort}/9
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Avg Post-Task</div>
              </div>
            </div>
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666'
            }}>
              Change: {cognitiveLoadMetrics.effortChangeScore > 0 ? '+' : ''}{cognitiveLoadMetrics.effortChangeScore} 
              ({cognitiveLoadMetrics.effortChangeScore > 0 ? 'Increased' : 'Decreased'} effort)
            </div>
          </div>

          {/* Offloading Behavior Summary */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>🧠 Cognitive Offloading</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {offloadingMetrics.avgHintsPerParticipant}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Avg Hints/Participant</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#607D8B' }}>
                  {offloadingMetrics.avgAudioReplaysPerParticipant}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Avg Audio Replays</div>
              </div>
            </div>
          </div>

          {/* Learning Performance Summary */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>🎯 Learning Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {accuracyMetrics.avgImmediateAccuracy}%
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Immediate Recall</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                  {accuracyMetrics.avgDelayedAccuracy}%
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Delayed Recall</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cognitive Offloading Tab */}
      {selectedTab === 'behavior' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          
          {/* Detailed Offloading Metrics */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🧠 Cognitive Offloading Behaviors</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {offloadingMetrics.totalHintsRequested}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Hints Requested</div>
              </div>
              
              <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#607D8B' }}>
                  {offloadingMetrics.totalAudioReplays}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Audio Replays</div>
              </div>
              
              <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF9800' }}>
                  {offloadingMetrics.avgModalTime}s
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Avg Time in Correction Modal</div>
              </div>
              
              <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {((offloadingMetrics.totalHintsRequested / Math.max(analytics.totalParticipants, 1)) * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Participants Using Hints</div>
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              marginTop: '16px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>Research Insights</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#333' }}>
                <li>Higher hint usage may indicate cognitive offloading behavior</li>
                <li>Audio replays suggest participants are leveraging external support</li>
                <li>Extended modal time could indicate increased cognitive effort</li>
                <li>Compare these metrics between treatment and control conditions</li>
              </ul>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>🔔 Recent Activity</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {analytics.events?.slice(0, 10).map((event, index) => (
                <div key={index} style={{
                  padding: '8px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {event.eventType.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div style={{ color: '#666', marginTop: '2px' }}>
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mental Effort Tab */}
      {selectedTab === 'cognitive_load' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>⚡ Mental Effort Analysis (Paas Scale)</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Mid-Task Effort:</span>
                <span style={{ fontWeight: 'bold', color: '#FF9800' }}>
                  {cognitiveLoadMetrics.avgMidTaskEffort}/9
                </span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(cognitiveLoadMetrics.avgMidTaskEffort / 9) * 100}%`,
                  backgroundColor: '#FF9800',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Post-Task Effort:</span>
                <span style={{ fontWeight: 'bold', color: '#FF5722' }}>
                  {cognitiveLoadMetrics.avgPostTaskEffort}/9
                </span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(cognitiveLoadMetrics.avgPostTaskEffort / 9) * 100}%`,
                  backgroundColor: '#FF5722',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: parseFloat(cognitiveLoadMetrics.effortChangeScore) > 0 ? '#ffebee' : '#e8f5e8',
              borderRadius: '6px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Effort Change: {cognitiveLoadMetrics.effortChangeScore > 0 ? '+' : ''}{cognitiveLoadMetrics.effortChangeScore}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {parseFloat(cognitiveLoadMetrics.effortChangeScore) > 0 
                  ? 'Participants reported higher effort after task completion'
                  : 'Participants reported lower effort after task completion'}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 Effort Distribution</h3>
            
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Total Paas responses: {cognitiveLoadMetrics.totalPaasResponses}
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f0f4f8',
              borderRadius: '6px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Interpretation Guide</h4>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                <strong>Low (1-3):</strong> Minimal cognitive load<br/>
                <strong>Medium (4-6):</strong> Moderate cognitive demand<br/>
                <strong>High (7-9):</strong> High cognitive load<br/><br/>
                <strong>Research Note:</strong> Compare effort levels between treatment and control conditions to assess the impact of generation vs. study modes on cognitive load.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Accuracy Tab */}
      {selectedTab === 'completion' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>✅ Learning Performance Metrics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '8px' }}>
                  {accuracyMetrics.avgImmediateAccuracy}%
                </div>
                <div style={{ fontSize: '16px', color: '#333', marginBottom: '4px' }}>Immediate Recall</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Transcription Task Accuracy</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2196F3', marginBottom: '8px' }}>
                  {accuracyMetrics.avgDelayedAccuracy}%
                </div>
                <div style={{ fontSize: '16px', color: '#333', marginBottom: '4px' }}>Delayed Recall</div>
                <div style={{ fontSize: '12px', color: '#666' }}>48-72hr Follow-up Accuracy</div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Generation Effect Analysis</h4>
              <div style={{ fontSize: '14px', color: '#666' }}>
                The difference between immediate and delayed recall can indicate the strength of the generation effect. 
                Compare these metrics across treatment (generation) and control (study) conditions.
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>📈 Progress Overview</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px' }}>Completion Rate</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{accuracyMetrics.completionRate}%</span>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: '#e0e0e0',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${accuracyMetrics.completionRate}%`,
                  backgroundColor: '#4CAF50',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{ fontSize: '14px', marginBottom: '12px' }}>
              <div>Baseline Assessments: {accuracyMetrics.totalBaselineAssessments}</div>
              <div>Total Participants: {analytics.totalParticipants || 0}</div>
              <div>Active Sessions: {analytics.activeSessions || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        🔄 Auto-refresh: 30s
      </div>
    </div>
  )
}
