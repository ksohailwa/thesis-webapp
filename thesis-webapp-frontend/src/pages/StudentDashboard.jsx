import React, { useEffect, useState } from 'react'
import api from '../utils/api'

export default function StudentDashboard(){
  const [results, setResults] = useState([])
  const [experiments, setExperiments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!api.getToken()) {
      window.location.href = '/student/login'
    } else {
      fetchResults()
      fetchExperiments()
    }
  }, [])

  async function fetchResults(){
    try {
      // For now, mock some results - we'd need to implement the actual endpoint
      setResults([])
    } catch(err){
      setError(err.message)
    }
  }

  async function fetchExperiments(){
    try {
      const list = await api.listExperiments()
      setExperiments(list)
    } catch(err){
      console.error('Could not fetch experiments:', err)
      // Not critical error, experiments might require auth
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h2>Student Dashboard</h2>
        <button className="button" onClick={() => { api.clearToken(); window.location.href='/student/login' }}>Logout</button>
      </div>
      
      {error && <div style={{color:'red'}}>{error}</div>}
      
      <section style={{marginBottom: 24}}>
        <h3>Available Experiments</h3>
        {experiments.length > 0 ? (
          <div style={{display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
            {experiments.map(exp => (
              <div key={exp._id} className="experiment-card">
                <h4>{exp.title}</h4>
                <p>Languages: {Array.isArray(exp.languages) ? exp.languages.join(', ') : 'N/A'}</p>
                <p>Status: {exp.status || 'Active'}</p>
                <a href={`/gapfill?experimentId=${exp._id}`} className="button">Start Exercise</a>
              </div>
            ))}
          </div>
        ) : (
          <p>No experiments available yet.</p>
        )}
      </section>
      
      <section>
        <h3>My Results</h3>
        {results.length > 0 ? (
          <ul>
            {results.map((r,i) => (
              <li key={i}>
                {r.itemId} → {r.response} ({r.correct ? '✔' : '✘'}) at {new Date(r.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No results yet. Complete some exercises to see your progress!</p>
        )}
      </section>
    </div>
  )
}
