# Running Your Cognitive Learning Study

A step-by-step guide for conducting your research with the implemented web application.

## 🎯 Experiment Overview

You now have a complete implementation that addresses your thesis research questions:

- **Research Question**: How does active answer generation vs system-provided answers affect learning and retention?
- **Key Mediator**: Mental effort (Paas scale) and cognitive offloading behaviors
- **Design**: Between-subjects with proper prior knowledge baseline

## 🚀 Pre-Experiment Checklist

### Technical Setup
- [ ] Backend server running (`npm run dev` in thesis-webapp-backend)
- [ ] Frontend server running (`npm run dev` in thesis-webapp-frontend)
- [ ] MongoDB connected and accessible
- [ ] Test participant registration and task flow
- [ ] Audio files uploaded to `public/audio/` directory
- [ ] Run `node test-backend.js` to verify API functionality

### Content Preparation
- [ ] Story content uploaded with target words identified
- [ ] Audio recordings prepared (story audio, target word audio)
- [ ] Target word definitions and difficulty levels validated
- [ ] Counterbalancing scheme decided (treatment vs control assignment)

### Research Ethics
- [ ] IRB approval obtained for your institution
- [ ] Informed consent language updated in registration component
- [ ] Data privacy statements reviewed
- [ ] Participant compensation method determined

## 👥 Participant Recruitment & Assignment

### Access URLs
- **Full Experiment (Treatment)**: `http://localhost:3000/experiment?experimentId=YOUR_EXP_ID&mode=treatment`
- **Full Experiment (Control)**: `http://localhost:3000/experiment?experimentId=YOUR_EXP_ID&mode=control`
- **Registration Only**: `http://localhost:3000/register`

### Condition Assignment Strategy
1. **Manual Assignment**: Share different URLs for treatment/control groups
2. **Counterbalanced**: Modify the registration component to automatically assign conditions
3. **Random Assignment**: Implement condition randomization in the backend

### Sample Recruitment Email
```
Subject: Cognitive Learning Study - 45 minutes, $10 compensation

Dear [Participant],

You're invited to participate in a study on learning and memory. The study takes about 45 minutes and includes:
- Reading and completing exercises with an audio story
- Testing your recall immediately and again in 2-3 days
- Brief questionnaires about your experience

Compensation: $10 gift card
Time: 45 minutes today + 15 minutes in 2-3 days

Study link: [INSERT_EXPERIMENT_URL]

Questions? Contact: [YOUR_EMAIL]
```

## 📊 Data Collection Monitoring

### Real-Time Monitoring
The system logs comprehensive data automatically:
- **Event logs**: Every interaction with timestamps
- **Results**: Accuracy scores and response times  
- **Paas ratings**: Mental effort at multiple time points
- **Behavioral data**: Keystrokes, hints, audio replays

### Data Quality Checks
Monitor for:
- Completion rates by condition
- Average time per task component
- Hint usage patterns
- Audio replay frequency
- Outlier response times

### Export Data During Collection
```bash
# Access MongoDB directly or use the API endpoints
# Results will be in these collections:
# - events (behavioral logs)
# - results (accuracy data)
# - participants (demographics)
```

## 🔬 Key Research Measures

### Primary Dependent Variables
1. **Immediate Recall**: Transcription task accuracy (Levenshtein distance)
2. **Delayed Recall**: 48-72hr spelling test accuracy
3. **Mental Effort**: Paas scale (1-9) at mid-task and post-task

### Behavioral Measures (Cognitive Offloading)
- Hint requests per word
- Time spent in correction modal
- Number of generation attempts before success
- Audio replay frequency

### Control Variables
- Prior knowledge baseline (familiarity ratings 1-6)
- Time spent on each component
- Order effects (word presentation)

## 📈 Statistical Analysis Plan

### Key Comparisons
1. **Main Effect**: Treatment vs Control on recall accuracy
2. **Mediation**: Does mental effort mediate the generation effect?
3. **Moderation**: Does prior knowledge moderate generation benefits?
4. **Behavioral**: Do hint-seeking patterns predict learning outcomes?

### Suggested Analysis Approach
```r
# Primary analysis in R
library(tidyverse)
library(mediation)

# Load exported data
results <- read_csv("experiment_results.csv")
events <- read_csv("behavioral_events.csv")

# Main effect analysis
model1 <- lm(delayed_recall ~ condition + prior_knowledge, data = results)

# Mediation analysis
model_m <- lm(mental_effort ~ condition, data = results)
model_y <- lm(delayed_recall ~ condition + mental_effort, data = results)
mediate(model_m, model_y, treat = "condition", mediator = "mental_effort")
```

## ⚠️ Common Issues & Troubleshooting

### Technical Issues
- **Audio not playing**: Check file paths in `public/audio/` directory
- **Slow loading**: Verify MongoDB connection and server resources
- **Mobile compatibility**: Test on various devices/screen sizes

### Participant Experience Issues
- **Confusion about tasks**: Add clearer instructions or practice trials
- **Technical difficulties**: Provide tech support contact information
- **Drop-out between sessions**: Send reminder emails for delayed testing

### Data Quality Issues
- **Very fast completion times**: May indicate non-engagement
- **No variation in Paas ratings**: Could suggest scale misunderstanding
- **High hint usage**: May indicate tasks are too difficult

## 📅 Timeline Management

### Session 1 (45 minutes)
- Registration & consent: 3 minutes
- Prior knowledge baseline: 8 minutes
- Gap-fill learning task: 20 minutes
- Transcription task: 12 minutes
- Final questions: 2 minutes

### Session 2 (15 minutes, 48-72hrs later)
- Delayed recall spelling test
- Brief follow-up questions
- Debriefing about study purpose

## 💾 Data Backup Strategy

1. **Automatic MongoDB backups**: Set up daily exports
2. **Participant tracking**: Keep encrypted list linking IDs to contact info
3. **Code version control**: Document any changes made during data collection
4. **Raw data preservation**: Export data in multiple formats

## 🎉 Post-Collection Steps

1. **Data cleaning**: Remove invalid/incomplete responses
2. **Blind condition coding**: Assign analyst who doesn't know condition assignments
3. **Replication package**: Document all analysis code and decisions
4. **Results interpretation**: Consider both statistical and practical significance

---

**Your study now implements evidence-based practices for studying generation effects with proper controls for prior knowledge, objective behavioral measurement, and comprehensive cognitive load assessment. Good luck with your research!**
