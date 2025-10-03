import { generateStory } from '../services/llm.js';

router.post('/experiments/:id/story', requireAuth, requireRole('teacher'), async (req,res)=>{
  try {
    const { targetWords, language="en" } = req.body;
    const storyText = await generateStory(targetWords, language);

    // Save to DB
    const exp = await Experiment.findByIdAndUpdate(
      req.params.id,
      { $set: { story: { text: storyText, targetWords, language } } },
      { new: true }
    );
    res.json({ story: exp.story });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "LLM generation failed" });
  }
});
