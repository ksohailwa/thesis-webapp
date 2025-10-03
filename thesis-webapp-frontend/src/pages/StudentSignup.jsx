import React, { useState } from 'react'
import api from '../utils/api'


export default function StudentSignup(){
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [msg, setMsg] = useState('')


async function onSignup(e){
e.preventDefault()
setError(''); setMsg('')
try{
await api.teacherRegister({ name, email, password, role:'student' }) // teacherRegister can be reused with role override
setMsg('Student account created. You can now login.')
}catch(err){ setError(err.message) }
}


return (
<div className="container">
<h2>Student Signup</h2>
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