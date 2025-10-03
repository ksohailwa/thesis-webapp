import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import Analytics from '../components/Analytics'
import BehavioralAnalyticsDashboard from '../components/BehavioralAnalyticsDashboard'


export default function TeacherDashboard(){
const [experiments, setExperiments] = useState([])
const [title, setTitle] = useState('Demo Experiment')
const [languages, setLanguages] = useState('en,de')
const [targets, setTargets] = useState('pastry, oven, baker')
const [currentId, setCurrentId] = useState('')
const [message, setMessage] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
const [dashboardView, setDashboardView] = useState('management') // 'management', 'behavioral_analytics'


useEffect(()=>{ if (!api.getToken()) window.location.href = '/teacher/login' },[])
useEffect(()=>{ refresh() },[])


async function refresh(){
try{
  setLoading(true)
  setError('')
  console.log('Fetching experiments...')
  const list = await api.listExperiments()
  console.log('Experiments received:', list)
  setExperiments(list || [])
}catch(e){
  console.error('Error fetching experiments:', e)
  setError('Failed to load experiments: ' + e.message)
}finally{
  setLoading(false)
}
}


async function create(){
try{
const langs = languages.split(',').map(s=>s.trim()).filter(Boolean)
const exp = await api.createExperiment({ title, languages: langs, design:{}, hint_rules:{ min_attempts_before_hint:3, time_before_auto_hint_seconds:120 } })
setMessage('Experiment created: ' + exp._id); setCurrentId(exp._id)
await refresh()
}catch(e){ setMessage('Error: ' + e.message) }
}


async function generate(){
try{
if (!currentId) return setMessage('Select an experiment (or create one)')
const langs = languages.split(',').map(s=>s.trim()).filter(Boolean)
const ts = targets.split(',').map(s=>s.trim()).filter(Boolean)
const r = await api.uploadTargets(currentId, { targets: ts, languages: langs })
setMessage(r.message || 'Generated')
}catch(e){ setMessage('Error: ' + e.message) }
}
return (
<div className="container">
<div className="header">
<h2>Research Dashboard</h2>
<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  {/* Dashboard View Selector */}
  <div style={{ display: 'flex', backgroundColor: '#f5f5f5', borderRadius: '6px', padding: '4px' }}>
    <button 
      className="button"
      onClick={() => setDashboardView('management')}
      style={{
        backgroundColor: dashboardView === 'management' ? '#2196F3' : 'transparent',
        color: dashboardView === 'management' ? 'white' : '#666',
        fontSize: '14px',
        padding: '8px 16px'
      }}
    >
      📋 Management
    </button>
    <button 
      className="button"
      onClick={() => setDashboardView('behavioral_analytics')}
      style={{
        backgroundColor: dashboardView === 'behavioral_analytics' ? '#2196F3' : 'transparent',
        color: dashboardView === 'behavioral_analytics' ? 'white' : '#666',
        fontSize: '14px',
        padding: '8px 16px'
      }}
    >
      🧠 Behavioral Analytics
    </button>
  </div>
  
  <button className="button" onClick={()=>{ api.clearToken(); window.location.href='/teacher/login' }}>Logout</button>
</div>
</div>

{/* Management View */}
{dashboardView === 'management' && (
  <div>
    {error && <div className="error" style={{marginBottom:16}}>{error}</div>}
    {loading && <div style={{marginBottom:16}}>Loading experiments...</div>}

    <section style={{marginBottom:24}}>
      <h3>Create New Experiment</h3>
      <div style={{ display: 'grid', gap: '12px', maxWidth: '600px' }}>
        <input className="input" placeholder="Experiment Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="Languages (e.g., en,de,fr)" value={languages} onChange={e=>setLanguages(e.target.value)} />
        <button className="button" onClick={create} style={{ backgroundColor: '#4CAF50', color: 'white' }}>Create Experiment</button>
      </div>
    </section>

    <section style={{marginBottom:24}}>
      <h3>Generate Content</h3>
      <div style={{ display: 'grid', gap: '12px', maxWidth: '600px' }}>
        <select className="input" value={currentId} onChange={e=>setCurrentId(e.target.value)}>
          <option value="">Select experiment</option>
          {experiments.map(e => <option key={e._id} value={e._id}>{e.title} — {e._id}</option>)}
        </select>
        <input className="input" placeholder="Target words (e.g., pastry, oven, baker)" value={targets} onChange={e=>setTargets(e.target.value)} />
        <button className="button" onClick={generate} style={{ backgroundColor: '#FF9800', color: 'white' }}>Generate Stories & Audio</button>
        {message && <div className="small" style={{marginTop:8, padding:'8px', backgroundColor:'#f0f4f8', borderRadius:'4px'}}>{message}</div>}
      </div>
    </section>

    <section>
      <h3>Existing Experiments</h3>
      {experiments.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No experiments created yet. Create your first experiment above.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {experiments.map(e => (
            <div key={e._id} style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{e.title}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  ID: {e._id} | Languages: {Array.isArray(e.languages) ? e.languages.join(', ') : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a 
                  href={`/experiment?experimentId=${e._id}&mode=treatment`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="button"
                  style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#2196F3', color: 'white' }}
                >
                  Treatment Link
                </a>
                <a 
                  href={`/experiment?experimentId=${e._id}&mode=control`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="button"
                  style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#FF9800', color: 'white' }}
                >
                  Control Link
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {currentId && (
      <section style={{ marginTop: '32px' }}>
        <h3>Basic Analytics</h3>
        <Analytics experimentId={currentId} />
      </section>
    )}
  </div>
)}

{/* Behavioral Analytics View */}
{dashboardView === 'behavioral_analytics' && (
  <div>
    {!currentId ? (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '2px dashed #ddd'
      }}>
        <h3 style={{ color: '#666', marginBottom: '16px' }}>Select an Experiment for Behavioral Analytics</h3>
        <select 
          className="input" 
          value={currentId} 
          onChange={e=>setCurrentId(e.target.value)}
          style={{ maxWidth: '400px', marginBottom: '16px' }}
        >
          <option value="">Choose an experiment to analyze...</option>
          {experiments.map(e => <option key={e._id} value={e._id}>{e.title} — {e._id}</option>)}
        </select>
        <div style={{ fontSize: '14px', color: '#666' }}>
          The behavioral analytics dashboard provides real-time insights into cognitive offloading patterns, 
          mental effort assessments, and learning performance metrics.
        </div>
      </div>
    ) : (
      <BehavioralAnalyticsDashboard experimentId={currentId} />
    )}
  </div>
)}
</div>
)
}
