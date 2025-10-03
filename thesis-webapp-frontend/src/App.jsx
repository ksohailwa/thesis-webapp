import React from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import Navigation from './components/Navigation'
import Register from './pages/Register'
import GapFill from './pages/GapFill'
import ExperimentFlow from './pages/ExperimentFlow'
import DelayedRecallTest from './components/DelayedRecallTest'
import TeacherLogin from './pages/TeacherLogin'
import TeacherSignup from './pages/TeacherSignup'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentSignup from './pages/StudentSignup'
import StudentLogin from './pages/StudentLogin'
import StudentDashboard from './pages/StudentDashboard'

function Home(){
const nav = useNavigate()
return (
<div className="container">
<h1>Thesis WebApp — Cognitive Learning Study</h1>
<div style={{display:'flex',flexDirection:'column',gap:8}}>
<h3>Student</h3>
<button className="button" onClick={()=>nav('/register')}>One-time Register (consent)</button>
<button className="button" onClick={()=>nav('/student/signup')}>Signup</button>
<button className="button" onClick={()=>nav('/student/login')}>Login</button>
<button className="button" onClick={()=>nav('/experiment?experimentId=507f1f77bcf86cd799439011&mode=treatment')}>Start Full Experiment (Treatment)</button>
<button className="button" onClick={()=>nav('/experiment?experimentId=507f1f77bcf86cd799439011&mode=control')}>Start Full Experiment (Control)</button>

<h3>Teacher</h3>
<button className="button" onClick={()=>nav('/teacher/signup')}>Signup</button>
<button className="button" onClick={()=>nav('/teacher/login')}>Login</button>

<h3>Legacy (Gap-Fill Only)</h3>
<button className="button" onClick={()=>nav('/gapfill?experimentId=507f1f77bcf86cd799439011&mode=treatment')} style={{fontSize:'14px', backgroundColor:'#f5f5f5', color:'#666'}}>Gap-Fill Task Only</button>
</div>
</div>
)
}


function GapFillWrapper(){
const [qs] = useSearchParams()
const experimentId = qs.get('experimentId') || '507f1f77bcf86cd799439011'
const mode = qs.get('mode') || 'treatment'
return <GapFill experimentId={experimentId} mode={mode} />
}


export default function App(){
return (
<BrowserRouter>
<Navigation />
<Routes>
<Route path="/" element={<Home/>} />
<Route path="/register" element={<Register onRegistered={(p)=>{ window.location.href = `/experiment?experimentId=507f1f77bcf86cd799439011` }} />} />
<Route path="/experiment" element={<ExperimentFlow/>} />
<Route path="/delayed-recall" element={<DelayedRecallTest/>} />
<Route path="/gapfill" element={<GapFillWrapper/>} />
<Route path="/teacher/signup" element={<TeacherSignup/>} />
<Route path="/teacher/login" element={<TeacherLogin/>} />
<Route path="/teacher/dashboard" element={<TeacherDashboard/>} />
<Route path="/student/signup" element={<StudentSignup/>} />
<Route path="/student/login" element={<StudentLogin/>} />
<Route path="/student/dashboard" element={<StudentDashboard/>} />
</Routes>
</BrowserRouter>
)
}