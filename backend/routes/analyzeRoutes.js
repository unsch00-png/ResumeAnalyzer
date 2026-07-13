const Analysis = require('../models/Analysis');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // PDF se text nikalo
    const parser = new PDFParse({ data: req.file.buffer });
const pdfData = await parser.getText();
const resumeText = pdfData.text;

    // Gemini ko prompt bhejo
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `You are an expert resume reviewer and career coach. Analyze the following resume and provide feedback in strict JSON format only (no markdown, no code blocks, just raw JSON) with this exact structure:

{
  "overallScore": <number out of 100>,
  "strengths": ["point1", "point2", "point3"],
  "weaknesses": ["point1", "point2", "point3"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Resume text:
${resumeText}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Agar Gemini kabhi markdown code block bhej de, usse clean karo
    responseText = responseText.replace(/```json|```/g, '').trim();

    const analysis = JSON.parse(responseText);
    await Analysis.create({
  fileName: req.file.originalname,
  overallScore: analysis.overallScore,
  strengths: analysis.strengths,
  weaknesses: analysis.weaknesses,
  missingKeywords: analysis.missingKeywords,
  suggestions: analysis.suggestions,
});
    res.json(analysis);
  } catch (err) {
    console.error('Error analyzing resume:', err);
    res.status(500).json({ message: 'Failed to analyze resume', error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await Analysis.find().sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

router.delete('/history/:id', async (req, res) => {
  try {
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});