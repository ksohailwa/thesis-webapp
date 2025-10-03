import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Analytics({ experimentId }) {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    completedSessions: 0,
    averageScore: 0,
    recentResults: []
  })
  
  useEffect(() => {
    fetchAnalytics()
  }, [experimentId])

  const fetchAnalytics = async () => {
    if (!experimentId) return
    
    try {
      console.log('Fetching analytics for experiment:', experimentId)
      const data = await api.getExperimentAnalytics(experimentId)
      console.log('Analytics data received:', data)
      
      setStats({
        totalParticipants: data.totalParticipants || 0,
        completedSessions: data.completedSessions || 0,
        averageScore: data.averageScore || 0,
        averageTimeOnTask: data.averageTimeOnTask || 0,
        recentResults: data.recentResults || [],
        scoreDistribution: data.scoreDistribution || { excellent: 0, good: 0, needsImprovement: 0 }
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Fallback to empty data if API fails
      setStats({
        totalParticipants: 0,
        completedSessions: 0,
        averageScore: 0,
        averageTimeOnTask: 0,
        recentResults: [],
        scoreDistribution: { excellent: 0, good: 0, needsImprovement: 0 }
      })
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const handleExportResults = () => {
    // Export the results as CSV
    const exportData = stats.recentResults.map(result => ({
      Participant: result.participant,
      Score: result.score,
      'Completion Date': result.completed,
      'Performance Level': result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Improvement'
    }))
    
    api.exportToCSV(exportData, `experiment-${experimentId}-results`)
  }

  const handleExportSummary = () => {
    // Export summary statistics
    const summaryData = [
      {
        Metric: 'Total Participants',
        Value: stats.totalParticipants
      },
      {
        Metric: 'Completed Sessions',
        Value: stats.completedSessions
      },
      {
        Metric: 'Average Score',
        Value: `${stats.averageScore.toFixed(1)}%`
      },
      {
        Metric: 'Completion Rate',
        Value: `${stats.totalParticipants > 0 ? ((stats.completedSessions / stats.totalParticipants) * 100).toFixed(1) : 0}%`
      }
    ]
    
    api.exportToCSV(summaryData, `experiment-${experimentId}-summary`)
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h3>Analytics Dashboard</h3>
        <div className="export-controls">
          <button className="button export-btn" onClick={handleExportSummary}>
            📊 Export Summary
          </button>
          <button className="button export-btn" onClick={handleExportResults}>
            📋 Export Results
          </button>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Participants</h4>
          <div className="stat-number">{stats.totalParticipants}</div>
        </div>
        
        <div className="stat-card">
          <h4>Completed Sessions</h4>
          <div className="stat-number">{stats.completedSessions}</div>
        </div>
        
        <div className="stat-card">
          <h4>Average Score</h4>
          <div className="stat-number">{stats.averageScore.toFixed(1)}%</div>
        </div>
        
        <div className="stat-card">
          <h4>Completion Rate</h4>
          <div className="stat-number">
            {stats.totalParticipants > 0 
              ? ((stats.completedSessions / stats.totalParticipants) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      <section className="recent-results">
        <h4>Recent Results</h4>
        {stats.recentResults.length > 0 ? (
          <table className="results-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Score</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentResults.map(result => (
                <tr key={result.id}>
                  <td>{result.participant}</td>
                  <td>
                    <span style={{ color: getScoreColor(result.score), fontWeight: 'bold' }}>
                      {result.score}%
                    </span>
                  </td>
                  <td>{result.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No results available yet.</p>
        )}
      </section>

      <section className="score-distribution">
        <h4>Score Distribution</h4>
        <div className="score-bars">
          {stats.scoreDistribution && (
            <>
              <div className="score-bar">
                <span className="score-label">80-100%</span>
                <div className="bar-container">
                  <div 
                    className="bar excellent" 
                    style={{ 
                      width: `${stats.scoreDistribution.excellent || 0}%` 
                    }}
                  ></div>
                </div>
                <span className="score-count">
                  {stats.scoreDistribution.excellent || 0}
                </span>
              </div>
              
              <div className="score-bar">
                <span className="score-label">60-79%</span>
                <div className="bar-container">
                  <div 
                    className="bar good" 
                    style={{ 
                      width: `${stats.scoreDistribution.good || 0}%` 
                    }}
                  ></div>
                </div>
                <span className="score-count">
                  {stats.scoreDistribution.good || 0}
                </span>
              </div>
              
              <div className="score-bar">
                <span className="score-label">0-59%</span>
                <div className="bar-container">
                  <div 
                    className="bar needs-improvement" 
                    style={{ 
                      width: `${stats.scoreDistribution.needsImprovement || 0}%` 
                    }}
                  ></div>
                </div>
                <span className="score-count">
                  {stats.scoreDistribution.needsImprovement || 0}
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
