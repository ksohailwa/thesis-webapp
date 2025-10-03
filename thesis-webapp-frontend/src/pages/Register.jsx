import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'


export default function Register({ onRegistered }){
const { t, i18n } = useTranslation()
const [locale, setLocale] = useState('en')
const [consent, setConsent] = useState(false)
const [email, setEmail] = useState('')
const [error, setError] = useState(null)


async function submit(e){
e.preventDefault()
if (!consent) return setError('consent required')
try {
const resp = await api.registerParticipant({ consent: { given: true, lang: locale, timestamp: new Date().toISOString() }, locale, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, email })
// store for session
localStorage.setItem('participantId', resp.participantId)
localStorage.setItem('participantCode', resp.participant_code)
localStorage.setItem('locale', locale)
i18n.changeLanguage(locale)
onRegistered(resp)
} catch (err) {
setError(err.message)
}
}


return (
<div className="container">
<div className="header"><h2>{t('register_title')}</h2>
<div>
<select value={locale} onChange={e=>setLocale(e.target.value)}>
<option value="en">English</option>
<option value="de">Deutsch</option>
</select>
</div>
</div>


<p>{t('consent_text')}</p>


<form onSubmit={submit}>
<input className="input" placeholder="Optional email for reminders" value={email} onChange={e=>setEmail(e.target.value)} />
<label style={{display:'block', marginBottom:8}}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} /> {t('consent_text')}</label>
{error && <div style={{color:'red'}}>{error}</div>}
<button className="button" type="submit">{t('start_test')}</button>
</form>


<hr />
<p className="small">{t('tutorial_short')}</p>
</div>
)
}