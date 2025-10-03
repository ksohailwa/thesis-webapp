import React, { useState } from 'react'
import api from '../utils/api'


export default function TeacherSignup(){
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [msg, setMsg] = useState('')


async function onSignup(e){
e.preventDefault()
setError(''); setMsg('')
try{
console.log('API object:', api)
console.log('teacherRegister function:', api.teacherRegister)
if (!api.teacherRegister) {
  throw new Error('teacherRegister function is not available')
}
const result = await api.teacherRegister({ name, email, password, role: 'teacher' })
console.log('Registration result:', result)
setMsg('Teacher account created. You can now login.')
}catch(err){ 
  console.error('Registration error:', err)
  setError(err.message) 
}
}


return (
<div className="container">
<h2>Teacher Signup</h2>
<form onSubmit={onSignup}>
<input className="input" placeholder="name" value={name} onChange={e=>setName(e.target.value)} />
<input className="input" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
<input className="input" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
{error && <div style={{color:'red'}}>{error}</div>}
{msg && <div style={{color:'green'}}>{msg}</div>}
<button className="button" type="submit">Signup</button>
</form>
</div>
)
}