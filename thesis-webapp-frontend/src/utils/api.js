const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Auth helper functions
export function setToken(token){ localStorage.setItem('accessToken', token) }
export function getToken(){ return localStorage.getItem('accessToken') || '' }
export function clearToken(){ localStorage.removeItem('accessToken') }
export function isAuthed(){ return !!getToken() }

function buildHeaders(){
const h = { 'Content-Type': 'application/json' }
const token = localStorage.getItem('accessToken')
if (token) h['Authorization'] = `Bearer ${token}`
return h
}

async function request(path, opts={}){
const res = await fetch(API_URL + path, {
headers: buildHeaders(),
...opts
})
if (!res.ok) {
const text = await res.text()
throw new Error(`${res.status} ${res.statusText} - ${text}`)
}
return res.json()
}


export async function registerParticipant(payload){
return request('/v1/participants/register', { method: 'POST', body: JSON.stringify(payload) })
}


export async function createExperiment(payload){
return request('/v1/experiments', { method: 'POST', body: JSON.stringify(payload) })
}


export async function uploadTargets(expId, payload){
return request(`/v1/experiments/${expId}/upload-targets`, { method: 'POST', body: JSON.stringify(payload) })
}


export async function fetchStimuli(expId, lang='en'){
return request(`/v1/experiments/${expId}/stimuli?lang=${lang}`)
}

export async function submitAttempt(payload){
return request('/v1/tasks/submit-attempt', { method: 'POST', body: JSON.stringify(payload) })
}


export async function revealHint(payload){
return request('/v1/tasks/reveal-hint', { method: 'POST', body: JSON.stringify(payload) })
}


export async function submitResult(payload){
return request('/v1/tasks/submit-result', { method: 'POST', body: JSON.stringify(payload) })
}


export async function submitPaas(payload){
return request('/v1/tasks/submit-paas', { method: 'POST', body: JSON.stringify(payload) })
}
// Auth functions
export async function teacherRegister(payload){
return request('/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export async function teacherLogin(payload){
return request('/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export async function studentRegister(payload){
return request('/v1/auth/register', { method: 'POST', body: JSON.stringify({...payload, role: 'student'}) })
}

export async function studentLogin(payload){
return request('/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getProfile(token){
return request('/v1/auth/me', { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
}

// Experiment management functions
export async function listExperiments(){
return request('/v1/experiments', { method: 'GET' })
}

export async function getExperiment(id){
return request(`/v1/experiments/${id}`, { method: 'GET' })
}

export async function exportExperimentResults(experimentId, format = 'csv'){
return request(`/v1/experiments/${experimentId}/export?format=${format}`, { method: 'GET' })
}

// CSV export helper
export async function exportToCSV(data, filename) {
  if (!data || data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => 
      JSON.stringify(row[header] || '')
    ).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Analytics API functions
export async function getExperimentAnalytics(experimentId){
return request(`/v1/analytics/experiments/${experimentId}`, { method: 'GET' })
}

export async function getParticipantProgress(participantId, experimentId = null){
const params = experimentId ? `?experimentId=${experimentId}` : ''
return request(`/v1/analytics/participants/${participantId}${params}`, { method: 'GET' })
}

// Delayed recall API functions
export async function generateDelayedRecallLink(payload) {
return request('/v1/delayed-recall/generate-link', { method: 'POST', body: JSON.stringify(payload) })
}

export async function validateDelayedRecallSession(payload) {
return request('/v1/delayed-recall/validate-session', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getDelayedRecallSessions(participantId, experimentId = null) {
const params = experimentId ? `?experimentId=${experimentId}` : ''
return request(`/v1/delayed-recall/sessions/${participantId}${params}`, { method: 'GET' })
}

export async function completeDelayedRecallSession(payload) {
return request('/v1/delayed-recall/complete-session', { method: 'POST', body: JSON.stringify(payload) })
}

export async function generateBulkDelayedRecallLinks(payload) {
return request('/v1/delayed-recall/generate-bulk-links', { method: 'POST', body: JSON.stringify(payload) })
}


export default { 
  registerParticipant, 
  createExperiment, 
  uploadTargets, 
  fetchStimuli, 
  submitAttempt, 
  revealHint, 
  submitResult, 
  submitPaas,
  teacherRegister,
  teacherLogin,
  studentRegister,
  studentLogin,
  getProfile,
  listExperiments,
  getExperiment,
  exportExperimentResults,
  exportToCSV,
  getExperimentAnalytics,
  getParticipantProgress,
  generateDelayedRecallLink,
  validateDelayedRecallSession,
  getDelayedRecallSessions,
  completeDelayedRecallSession,
  generateBulkDelayedRecallLinks,
  setToken,
  getToken,
  clearToken,
  isAuthed
}


