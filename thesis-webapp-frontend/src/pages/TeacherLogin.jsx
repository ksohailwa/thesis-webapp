import React, { useState } from 'react'
import api from '../utils/api'


export default function TeacherLogin(){
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')


async function onLogin(e){
e.preventDefault()
setError('')
try{
const resp = await api.teacherLogin({ email, password })
api.setToken(resp.accessToken)
window.location.href = '/teacher/dashboard'
}catch(err){ setError(err.message) }
}


return (
<div className="container">
<h2>Teacher Login</h2>
<form onSubmit={onLogin}>
<input className="input" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
<input className="input" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
{error && <div style={{color:'red'}}>{error}</div>}
<button className="button" type="submit">Login</button>
</form>
</div>
)
}