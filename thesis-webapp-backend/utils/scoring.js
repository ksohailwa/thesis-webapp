const levenshtein = require('fast-levenshtein');


function normalizeForScoring(s, locale='en'){
if (!s) return '';
s = s.normalize('NFKC').toLocaleLowerCase(locale).trim();
s = s.replace(/\s+/g,' ');
return s;
}


function levenshteinDistance(a,b){
return levenshtein.get(a,b);
}


function normalizedScore(lev, lenCorrect, lenResponse){
const denom = Math.max(1, Math.max(lenCorrect, lenResponse));
const score = 1 - (lev / denom);
return Math.max(0, Math.min(1, score));
}


module.exports = { normalizeForScoring, levenshteinDistance, normalizedScore };
