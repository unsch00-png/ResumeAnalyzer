const mammoth = require('mammoth');
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

    let resumeText = '';
    const fileName = req.file.originalname.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: req.file.buffer });
      const pdfData = await parser.getText();
      resumeText = pdfData.text;
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      resumeText = result.value;
    } else {
      return res.status(400).json({ message: 'Only PDF and DOCX files are supported' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const jobDescription = req.body.jobDescription || '';

    const jobMatchInstructions = jobDescription
      ? `\n\nAlso compare this resume against the following job description. Include two additional fields in the JSON:
"jobMatchScore": <number out of 100 representing how well the resume matches this job>,
"jobMatchGaps": ["specific skill or requirement missing for this job", "..."]

Job Description:
${jobDescription}`
      : '';

    const prompt = `You are an expert resume reviewer and career coach. Analyze the following resume and provide feedback in strict JSON format only (no markdown, no code blocks, just raw JSON) with this exact structure:

{
  "overallScore": <number out of 100>,
  "strengths": ["point1", "point2", "point3"],
  "weaknesses": ["point1", "point2", "point3"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}${jobMatchInstructions}

Resume text:
${resumeText}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    responseText = responseText.replace(/```json|```/g, '').trim();

    const analysis = JSON.parse(responseText);

    await Analysis.create({
      fileName: req.file.originalname,
      overallScore: analysis.overallScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingKeywords: analysis.missingKeywords,
      suggestions: analysis.suggestions,
      jobMatchScore: analysis.jobMatchScore || null,
      jobMatchGaps: analysis.jobMatchGaps || [],
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

router.delete('/history/:id', async (req, res) => {
  try {
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;