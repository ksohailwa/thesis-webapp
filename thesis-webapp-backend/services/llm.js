import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_API_KEY in .env");
}
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateStory(targetWords, language="en") {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
  Create a short engaging story in ${language}.
  The story must naturally include these target words: ${targetWords.join(", ")}.
  Keep it suitable for students.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
