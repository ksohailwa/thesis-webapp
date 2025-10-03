export function setToken(token){ localStorage.setItem('accessToken', token) }
export function getToken(){ return localStorage.getItem('accessToken') || '' }
export function clearToken(){ localStorage.removeItem('accessToken') }
export function isAuthed(){ return !!getToken() }


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'


function buildHeaders(){
const h = { 'Content-Type': 'application/json' }
const token = localStorage.getItem('accessToken')
if (token) h['Authorization'] = `Bearer ${token}`
return h
}


async function request(path, opts={}){
const res = await fetch(API_URL + path, { headers: buildHeaders(), ...opts })
if (!res.ok) {
const text = await res.text()
throw new Error(`${res.status} ${res.statusText} - ${text}`)
}
return res.json()
}


export async function registerParticipant(payload){
return request('/v1/participants/register', { method: 'POST', body: JSON.stringify(payload) })
}


// TEACHER AUTH
export async function teacherRegister({ email, password, name }){
return request('/v1/auth/register', { method: 'POST', body: JSON.stringify({ email, password, role:'teacher', name }) })
}
export async function teacherLogin({ email, password }){
return request('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}
export async function me(){ return request('/v1/auth/me') }


// EXPERIMENT MGMT (auth required)
export async function listExperiments(){ return request('/v1/experiments') }
export async function createExperiment(payload){ return request('/v1/experiments', { method: 'POST', body: JSON.stringify(payload) }) }
export async function uploadTargets(expId, payload){ return request(`/v1/experiments/${expId}/upload-targets`, { method: 'POST', body: JSON.stringify(payload) }) }
export async function fetchStimuli(expId, lang='en'){ return request(`/v1/experiments/${expId}/stimuli?lang=${lang}`) }


// STUDENT TASKS (public)
export async function submitAttempt(payload){ return request('/v1/tasks/submit-attempt', { method: 'POST', body: JSON.stringify(payload) }) }
export async function revealHint(payload){ return request('/v1/tasks/reveal-hint', { method: 'POST', body: JSON.stringify(payload) }) }
export async function submitResult(payload){ return request('/v1/tasks/submit-result', { method: 'POST', body: JSON.stringify(payload) }) }
export async function submitPaas(payload){ return request('/v1/tasks/submit-paas', { method: 'POST', body: JSON.stringify(payload) }) }


export default { registerParticipant, teacherRegister, teacherLogin, me, listExperiments, createExperiment, uploadTargets, fetchStimuli, submitAttempt, revealHint, submitResult, submitPaas }

