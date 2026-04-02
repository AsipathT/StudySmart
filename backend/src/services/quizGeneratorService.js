const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

class QuizGeneratorService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Extract text from PDF
   */
  async extractTextFromPDF(fileUrl) {
    const normalizedUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const filePath = path.join(__dirname, '..', normalizedUrl);
    if (!fs.existsSync(filePath)) throw new Error(`PDF file not found at: ${filePath}`);

    const dataBuffer = fs.readFileSync(filePath);
    console.log(`Extracting text from: ${filePath}`);
    const data = await pdfParse(dataBuffer);
    console.log(`Extracted text length: ${data.text?.length || 0}`);
    return data.text;
  }

  async getAuthorizedModel() {
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`;
    try {
      const resp = await fetch(listUrl);
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error?.message || 'Failed to list models');
      }

      const allGenerateModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));

      if (allGenerateModels.length === 0) {
        throw new Error('No models supporting "generateContent" found for this API key.');
      }

      const preferredModel = allGenerateModels.find(m =>
        m.name.includes('gemini-1.5-flash') ||
        m.name.includes('gemini-pro') ||
        m.name.includes('gemini-1.5-pro')
      );

      const selectedModel = preferredModel || allGenerateModels[0];
      console.log(`Using authorized model: ${selectedModel.name}`);
      return selectedModel.name;
    } catch (error) {
      console.error('Model Search Error:', error.message);
      throw error;
    }
  }

  /**
   * Generate Quiz using Gemini
   */
  async generateQuiz(text, materialName) {
    if (!this.apiKey) throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');

    const prompt = `
      You are an expert academic tutor. Based on the following study material titled "${materialName}", generate a multiple-choice quiz.
      Return the result strictly in JSON format matching this schema:
      {
        "title": "A catchy title for the quiz",
        "questions": [
          {
            "question": "The question text",
            "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
            "correctAnswer": 0,
            "explanation": "Brief explanation"
          }
        ]
      }
      Provide exactly 5 questions.
      Return ONLY the JSON object, no other text.

      Study Material Context:
      ${text.substring(0, 10000)}
    `;

    try {
      const modelName = await this.getAuthorizedModel();
      console.log(`Prompting ${modelName} for: ${materialName}`);

      const url = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Gemini API Error:', data);
        throw new Error(data.error?.message || 'Gemini API connection failed');
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No quiz generated. Content may have been filtered.');
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      console.log(`Gemini response: ${textResponse.substring(0, 100)}...`);

      let jsonStr = textResponse.match(/\{[\s\S]*\}/) ? textResponse.match(/\{[\s\S]*\}/)[0] : textResponse;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini Generation Error:', error.message);
      throw new Error(`Quiz generation failed: ${error.message}`);
    }
  }
}

module.exports = new QuizGeneratorService();
