const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: String,
    overallScore: Number,
    strengths: [String],
    weaknesses: [String],
    missingKeywords: [String],
    suggestions: [String],
    jobMatchScore: Number,
    jobMatchGaps: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);