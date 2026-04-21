const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
// pdf-parse v2 exports a `PDFParse` class (v1's default-function export is gone).
const { PDFParse } = require('pdf-parse');
const JSZip = require('jszip');

const unescapeXml = (s) => {
  if (!s) return '';
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
};

class FlashcardService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey, { apiVersion: 'v1' }) : null;
  }

  async extractTextFromPDF(fileUrl) {
    const normalizedUrl = fileUrl && String(fileUrl).startsWith('/') ? String(fileUrl).substring(1) : String(fileUrl || '');
    const filePath = path.join(__dirname, '..', normalizedUrl);
    if (!fs.existsSync(filePath)) throw new Error(`PDF file not found at: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    try {
      const result = await parser.getText();
      return result?.text || '';
    } finally {
      try { await parser.destroy(); } catch { /* ignore cleanup errors */ }
    }
  }

  async extractTextFromNotes(fileUrl, fileMime, fileName) {
    const normalizedUrl = fileUrl && String(fileUrl).startsWith('/') ? String(fileUrl).substring(1) : String(fileUrl || '');
    const filePath = path.join(__dirname, '..', normalizedUrl);
    if (!fs.existsSync(filePath)) throw new Error(`Notes file not found at: ${filePath}`);

    const isText =
      String(fileMime || '').startsWith('text/') ||
      /\.(txt|md)$/i.test(String(fileName || ''));

    if (!isText) {
      throw new Error('This Notes resource does not support text extraction.');
    }

    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Basic PPTX extraction:
   * - pptx is a zip
   * - slide text typically lives in ppt/slides/slide*.xml
   * - we extract common text tags: <a:t> and <w:t>
   */
  async extractTextFromPPTX(fileUrl) {
    const normalizedUrl = fileUrl && String(fileUrl).startsWith('/') ? String(fileUrl).substring(1) : String(fileUrl || '');
    const filePath = path.join(__dirname, '..', normalizedUrl);
    if (!fs.existsSync(filePath)) throw new Error(`PPTX file not found at: ${filePath}`);

    const dataBuffer = fs.readFileSync(filePath);
    let zip;
    try {
      zip = await JSZip.loadAsync(dataBuffer);
    } catch {
      throw new Error('Could not read presentation as PPTX. Older .ppt files are not supported; save as .pptx and re-upload.');
    }

    const slideXmlNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name));
    if (!slideXmlNames.length) return '';

    const parts = [];
    for (const name of slideXmlNames.sort()) {
      const xml = await zip.files[name].async('string');

      // Common pptx text elements.
      const matchesA = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi)].map((m) => unescapeXml(m[1]));
      const matchesW = [...xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)].map((m) => unescapeXml(m[1]));

      const combined = [...matchesA, ...matchesW].map((x) => String(x).trim()).filter(Boolean);
      if (combined.length) parts.push(combined.join(' '));
    }

    return parts.join('\n\n');
  }

  extractJsonObjectString(raw) {
    let s = String(raw || '').trim();
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) s = fenced[1].trim();
    const m = s.match(/\{[\s\S]*\}/);
    return m ? m[0] : s;
  }

  /**
   * Lower rank = try first. Deprioritize gemini-2.0-flash: free tier often hits quota there
   * while gemini-1.5-flash still has headroom (separate limits).
   */
  static modelPreferenceRank(fullName) {
    const n = String(fullName || '').toLowerCase();
    if (n.includes('gemini-1.5-flash')) return 10;
    if (n.includes('gemini-1.5-pro')) return 20;
    if (n.includes('gemini-2.5-flash')) return 25;
    if (n.includes('gemini-2.0-flash-lite')) return 28;
    if (n.includes('gemini-flash-lite')) return 30;
    if (n.includes('gemini-pro') && !n.includes('1.5') && !n.includes('2.5') && !n.includes('2.0')) return 40;
    if (n.includes('gemini-2.0-flash') && !n.includes('lite')) return 90;
    if (n.includes('gemini-2.0')) return 85;
    if (n.includes('gemini')) return 50;
    return 100;
  }

  isQuotaOrRateLimitError(err) {
    const msg = `${err?.message || err?.status || err}${err?.errorDetails ? JSON.stringify(err.errorDetails) : ''}`;
    return (
      /429|too many requests|quota exceeded|resource exhausted|rate limit|free_tier/i.test(msg)
    );
  }

  async fetchGenerateModelsList() {
    if (!this.apiKey) throw new Error('Gemini API key not configured');

    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`;
    let resp;
    let data;
    try {
      resp = await fetch(listUrl);
      const bodyText = await resp.text();
      try {
        data = JSON.parse(bodyText);
      } catch {
        throw new Error(`Failed to list Gemini models (${resp.status}). Check GEMINI_API_KEY and Generative Language API access.`);
      }
    } catch (e) {
      if (e.message && e.message.includes('Gemini')) throw e;
      throw new Error(`Could not reach Gemini API: ${e.message || e}`);
    }

    if (!resp.ok) {
      throw new Error(data?.error?.message || 'Failed to list models');
    }

    const rawModels = Array.isArray(data?.models) ? data.models : [];
    return rawModels.filter(
      (m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent')
    );
  }

  async getAuthorizedModelNamesOrdered() {
    const allGenerateModels = await this.fetchGenerateModelsList();

    if (!allGenerateModels.length) {
      throw new Error('No models supporting "generateContent" found for this API key. Enable the Generative Language API in Google Cloud.');
    }

    const ranked = [...allGenerateModels].sort((a, b) => {
      const ra = FlashcardService.modelPreferenceRank(a.name);
      const rb = FlashcardService.modelPreferenceRank(b.name);
      if (ra !== rb) return ra - rb;
      return String(a.name).localeCompare(String(b.name));
    });

    return ranked.map((m) => m.name);
  }

  async generateFlashcards(text, materialName, cardCount = 20) {
    if (!this.apiKey || !this.genAI) throw new Error('Gemini API key not configured');

    const safeCount = Math.max(5, Math.min(50, Number(cardCount) || 20));
    const materialTitle = String(materialName || 'Study Material').trim();

    const prompt = `
You are an expert study tutor. Create flashcards for learners based ONLY on the provided study material.

Return the result strictly in JSON format matching this schema (no extra text):
{
  "title": "A short deck title",
  "cards": [
    {
      "front": "A concise question, concept, or prompt for the student to recall",
      "back": "A concise, accurate answer/explanation grounded in the material",
      "hint": "Optional: a short hint or key phrase (can be empty string)"
    }
  ]
}

Hard constraints:
- Exactly ${safeCount} flashcards.
- Each "front" must be answerable using the study material.
- Each "back" must be concise (2-6 sentences max) and grounded in the study material.
- Do not invent facts not present in the material.
- Output ONLY the JSON object.

Study Material Context (may be long):
${String(text || '').substring(0, 15000)}
    `;

    const modelNames = await this.getAuthorizedModelNamesOrdered();
    let textResponse;
    let lastErr = null;

    for (const modelName of modelNames) {
      const modelId = String(modelName).replace(/^models\//, '');
      const model = this.genAI.getGenerativeModel({ model: modelId });
      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        });
        textResponse = result.response.text();
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        const msg = err?.message || String(err);
        console.warn(`[FlashcardService] generateContent failed for ${modelId}:`, msg.slice(0, 200));
        if (this.isQuotaOrRateLimitError(err) && modelNames.indexOf(modelName) < modelNames.length - 1) {
          continue;
        }
        if (this.isQuotaOrRateLimitError(err) && modelNames.indexOf(modelName) === modelNames.length - 1) {
          throw new Error(
            'Gemini quota or rate limit reached for all models we tried. Wait a minute and retry, enable billing in Google AI Studio, or switch to a tier with higher limits. Details: https://ai.google.dev/gemini-api/docs/rate-limits'
          );
        }
        throw new Error(msg.includes('API key') ? msg : `Gemini generation failed: ${msg}`);
      }
    }

    if (lastErr && !textResponse) {
      const msg = lastErr?.message || String(lastErr);
      throw new Error(msg.includes('API key') ? msg : `Gemini generation failed: ${msg}`);
    }

    const jsonStr = this.extractJsonObjectString(textResponse);
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[FlashcardService] JSON parse error; model output snippet:', String(textResponse).slice(0, 400));
      throw new Error('Could not parse flashcards from the model response. Try generating again.');
    }

    const cards = Array.isArray(parsed?.cards) ? parsed.cards : [];
    const normalizedCards = cards
      .filter((c) => c && typeof c.front === 'string' && typeof c.back === 'string')
      .slice(0, safeCount)
      .map((c) => ({
        front: String(c.front).trim(),
        back: String(c.back).trim(),
        hint: typeof c.hint === 'string' ? String(c.hint).trim() : ''
      }));

    // If Gemini returns fewer cards than requested, we still return what we have
    // (front-end will handle it).
    return {
      title: String(parsed?.title || `Flashcards: ${materialTitle}`).trim(),
      cards: normalizedCards
    };
  }
}

module.exports = new FlashcardService();

