const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    fileName: String,
    overallScore: Number,
    strengths: [String],
    weaknesses: [String],
    missingKeywords: [String],
    suggestions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);