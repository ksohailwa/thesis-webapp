import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'


const resources = {
en: {
translation: {
"title": "Thesis Study — Demo",
"register_title": "Participant registration",
"consent_text": "I consent to participate in this study.",
"start_test": "Start test",
"tutorial_short": "Short tutorial: Listen to the audio, fill the blanks, open correction if needed. Submit when done.",
"open_correction": "Open correction",
"reveal_hint": "Reveal hint",
"submit": "Submit",
"paas_question": "How much mental effort did that require? (1 = very low, 9 = very high)",
"thank_you": "Thank you — your data was recorded."
}
},
de: {
translation: {
"title": "Thesis-Studie — Demo",
"register_title": "Teilnehmer-Registrierung",
"consent_text": "Ich stimme der Teilnahme an dieser Studie zu.",
"start_test": "Test starten",
"tutorial_short": "Kurzanleitung: Hören Sie die Audiodatei, füllen Sie die Lücken aus, öffnen Sie die Korrektur falls nötig. Abschicken wenn fertig.",
"open_correction": "Korrektur öffnen",
"reveal_hint": "Hinweis anzeigen",
"submit": "Abschicken",
"paas_question": "Wie viel mentale Anstrengung war dafür nötig? (1 = sehr wenig, 9 = sehr viel)"
    }
}
}


i18n.use(initReactI18next).init({
resources,
lng: 'en',
fallbackLng: 'en',
interpolation: { escapeValue: false }
})


export default i18n