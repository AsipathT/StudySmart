const axios = require('axios');

class ChatbotService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.aiService    = process.env.AI_SERVICE || 'gemini';
    // In-memory conversation store (keyed by studentId)
    // NOTE: For production persistence, replace with DB-backed storage
    this.conversations = new Map();
    this.requestCounts = new Map();
  }

  /* ─────────────────────────────────────────────────────
     RATE LIMITER
  ───────────────────────────────────────────────────── */
  checkRateLimit(service) {
    const now       = Date.now();
    const windowMs  = 60_000;
    const maxReqs   = service === 'openai' ? 10 : 30;

    if (!this.requestCounts.has(service)) this.requestCounts.set(service, []);
    const requests = this.requestCounts.get(service).filter(t => now - t < windowMs);
    this.requestCounts.set(service, requests);

    if (requests.length >= maxReqs) return false;
    requests.push(now);
    return true;
  }

  /* ─────────────────────────────────────────────────────
     EXPONENTIAL BACKOFF RETRY
  ───────────────────────────────────────────────────── */
  async retryWithBackoff(apiCall, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        if (error.response?.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1_000;
          console.log(`Rate limited. Retrying in ${delay}ms… (${attempt + 1}/${maxRetries + 1})`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  }

  /* ─────────────────────────────────────────────────────
     PROCESS GENERAL QUERY  (called by controller)
  ───────────────────────────────────────────────────── */
  async processQuery(studentId, message, context = {}, history = []) {
    try {
      // Maintain per-student conversation memory
      if (!this.conversations.has(studentId)) this.conversations.set(studentId, []);
      const conversation = this.conversations.get(studentId);

      // Merge history passed by client with in-memory history
      // (client sends last 10 turns so we have context even after server restart)
      const mergedHistory = history.length > 0 ? history : conversation.slice(-10);

      const prompt = this.buildStudentPrompt(message, context, mergedHistory);

      let response = null;

      // 1. Try Gemini (default)
      if ((this.aiService === 'gemini' || !response) &&
          this.geminiApiKey &&
          this.geminiApiKey !== 'your-gemini-api-key-here' &&
          this.checkRateLimit('gemini')) {
        try {
          response = await this.getGeminiResponse(prompt);
        } catch (err) {
          console.warn('Gemini failed:', err.response?.data?.error?.message || err.message);
        }
      }

      // 2. Fallback to OpenAI
      if (!response &&
          this.openaiApiKey &&
          this.openaiApiKey !== 'your-openai-api-key-here' &&
          this.checkRateLimit('openai')) {
        try {
          response = await this.getOpenAIResponse(prompt);
        } catch (err) {
          console.warn('OpenAI failed:', err.response?.data?.error?.message || err.message);
        }
      }

      // 3. Rule-based fallback
      if (!response) {
        console.warn('All AI services failed — using rule-based fallback');
        response = this.getRuleBasedResponse(message, context);
      }

      // Update in-memory history
      conversation.push({ role: 'user',      content: message  });
      conversation.push({ role: 'assistant', content: response });
      if (conversation.length > 40) {
        this.conversations.set(studentId, conversation.slice(-40));
      }

      return response;
    } catch (error) {
      console.error('processQuery error:', error);
      return this.getFallbackResponse();
    }
  }

  /* ─────────────────────────────────────────────────────
     PERFORMANCE ADVICE  (called by controller for
     the /chatbot/performance endpoint)
  ───────────────────────────────────────────────────── */
  async getPerformanceAdvice(data) {
    try {
      const prompt  = this.buildPerformancePrompt(data);
      let response  = null;

      if (this.geminiApiKey &&
          this.geminiApiKey !== 'your-gemini-api-key-here' &&
          this.checkRateLimit('gemini')) {
        try { response = await this.getGeminiResponse(prompt); } catch (e) {
          console.warn('Gemini (perf) failed:', e.message);
        }
      }

      if (!response &&
          this.openaiApiKey &&
          this.openaiApiKey !== 'your-openai-api-key-here' &&
          this.checkRateLimit('openai')) {
        try { response = await this.getPerformanceOpenAIResponse(prompt); } catch (e) {
          console.warn('OpenAI (perf) failed:', e.message);
        }
      }

      return response || this.getPerformanceFallbackResponse(data);
    } catch (error) {
      console.error('getPerformanceAdvice error:', error);
      return this.getPerformanceFallbackResponse(data);
    }
  }

  /* ─────────────────────────────────────────────────────
     PROMPT BUILDER — rich student context + history
  ───────────────────────────────────────────────────── */
  buildStudentPrompt(message, context, history) {
    const {
      name               = 'Student',
      studentId,
      averageScore       = null,
      gpa                = null,
      riskLevel          = null,
      subjects           = [],
      attendance         = null,
      completedAssignments,
      totalAssignments,
      predictedGrade     = null,
      subjectBreakdown   = [],   // [{name, score, grade}]
      weakSubjects       = [],
      strongSubjects     = [],
    } = context;

    // ── Compute derived values ───────────────────────
    const computedGPA = gpa != null
      ? Number(gpa).toFixed(2)
      : averageScore != null
        ? Math.max(0, ((averageScore - 40) / 60) * 4.0).toFixed(2)
        : null;

    const computedRisk = riskLevel || (
      averageScore == null ? null :
      averageScore >= 75 ? 'LOW' :
      averageScore >= 50 ? 'MEDIUM' : 'HIGH'
    );

    // ── Build subject detail string ──────────────────
    let subjectDetail = '';
    if (subjectBreakdown.length > 0) {
      subjectDetail = '\nSubject Breakdown:\n' +
        subjectBreakdown.map(s => `  • ${s.name}: ${s.score}% (${s.grade || ''})`).join('\n');
    } else if (subjects.length > 0) {
      subjectDetail = `\nEnrolled Subjects: ${subjects.join(', ')}`;
    }

    // ── Build weak/strong subject hints ─────────────
    let subjectHints = '';
    if (weakSubjects.length > 0)   subjectHints += `\nSubjects needing improvement: ${weakSubjects.join(', ')}`;
    if (strongSubjects.length > 0) subjectHints += `\nStrong subjects: ${strongSubjects.join(', ')}`;

    // ── Build assignment completion string ───────────
    const assignmentStr = completedAssignments != null && totalAssignments != null
      ? `${completedAssignments}/${totalAssignments} completed`
      : completedAssignments != null ? `${completedAssignments} completed` : null;

    // ── Build recent conversation context ────────────
    const historyText = history.length > 0
      ? '\n=== RECENT CONVERSATION ===\n' +
        history.slice(-8).map(m =>
          `${m.role === 'user' ? `${name}` : 'StudySmart AI'}: ${m.content}`
        ).join('\n')
      : '';

    // ── Risk-based tone instruction ──────────────────
    const toneInstruction =
      computedRisk === 'HIGH'   ? 'Use an empathetic but urgent tone. Emphasise specific, immediate actions the student must take. Be encouraging but honest about the seriousness.'
    : computedRisk === 'MEDIUM' ? 'Use an encouraging, balanced tone. Point out both strengths and clear areas to improve.'
    : computedRisk === 'LOW'    ? 'Use a positive, motivating tone. Reinforce good habits and suggest ways to excel further.'
    : 'Use a friendly, supportive academic coaching tone.';

    return `You are StudySmart AI, an expert academic coach with access to this student's real performance data.
Your job is to give SPECIFIC, PERSONALISED advice based on their actual numbers — NOT generic study tips.
Always reference their real stats in your response.

=== STUDENT PROFILE ===
Name: ${name}${studentId ? ` (ID: ${studentId})` : ''}
GPA: ${computedGPA != null ? computedGPA : 'Not available'}
Average Score: ${averageScore != null ? `${Number(averageScore).toFixed(1)}%` : 'Not available'}
Attendance: ${attendance != null ? `${attendance}%` : 'Not available'}
Assignments: ${assignmentStr || 'Not available'}
Risk Level: ${computedRisk || 'Not assessed'}
Predicted Grade: ${predictedGrade || 'Not available'}${subjectDetail}${subjectHints}

=== TONE INSTRUCTION ===
${toneInstruction}

=== INSTRUCTIONS ===
- Always reference the student's actual numbers (GPA, score, attendance) in your response
- Give concrete, actionable recommendations (specific study hours, assignment priorities, etc.)
- If the student asks about predictions, use their averageScore trend to estimate future performance
- If the student asks about improvement, identify the weakest areas from their data
- Keep responses concise (3-6 sentences) but data-driven and personal
- Do NOT give generic advice that ignores their real stats
- Format with line breaks where helpful for readability${historyText}

=== STUDENT'S QUESTION ===
${name}: ${message}

StudySmart AI:`;
  }

  /* ─────────────────────────────────────────────────────
     PERFORMANCE PROMPT (for /performance endpoint)
  ───────────────────────────────────────────────────── */
  buildPerformancePrompt(data) {
    const { studentName, gpa, attendance, completedAssignments, riskLevel, question, history } = data;

    const tone =
      riskLevel?.toLowerCase() === 'high'   ? 'Urgent and direct. Emphasise consequences and immediate actions required.'
    : riskLevel?.toLowerCase() === 'medium' ? 'Balanced and encouraging with practical steps.'
    : 'Positive and motivating. Focus on maintaining and exceeding current performance.';

    const historyText = (history || []).length > 0
      ? '\nRecent conversation:\n' +
        history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')
      : '';

    return `You are an experienced academic advisor. Give SPECIFIC advice using the student's real data.

Student Data:
- Name: ${studentName}
- GPA: ${gpa}
- Attendance: ${attendance}%
- Assignments Completed: ${completedAssignments}
- Risk Level: ${riskLevel}

Tone: ${tone}
Instructions: 3-5 sentences. Reference actual numbers. Minimum 1 specific actionable step.${historyText}

Question: ${question}

Advisor:`;
  }

  /* ─────────────────────────────────────────────────────
     GEMINI API CALL
  ───────────────────────────────────────────────────── */
  async getGeminiResponse(prompt) {
    return this.retryWithBackoff(async () => {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:     0.75,
            maxOutputTokens: 400,
            topP:            0.95,
            topK:            40,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const candidate = res.data?.candidates?.[0];
      if (!candidate) throw new Error('No candidates in Gemini response');
      // Check for content filtering
      if (candidate.finishReason === 'SAFETY') throw new Error('Gemini response blocked by safety filters');

      return candidate.content.parts[0].text.trim();
    });
  }

  /* ─────────────────────────────────────────────────────
     OPENAI API CALL (general)
  ───────────────────────────────────────────────────── */
  async getOpenAIResponse(prompt) {
    return this.retryWithBackoff(async () => {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are StudySmart AI, an expert academic coach. Give personalised, data-driven advice using the student\'s actual performance numbers.' },
            { role: 'user',   content: prompt },
          ],
          max_tokens:  400,
          temperature: 0.75,
        },
        { headers: { 'Authorization': `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' } }
      );
      return res.data.choices[0].message.content.trim();
    });
  }

  /* ─────────────────────────────────────────────────────
     OPENAI API CALL (performance)
  ───────────────────────────────────────────────────── */
  async getPerformanceOpenAIResponse(prompt) {
    return this.retryWithBackoff(async () => {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an experienced academic advisor. Give concise, actionable, data-driven advice in 3-5 sentences.' },
            { role: 'user',   content: prompt },
          ],
          max_tokens:  250,
          temperature: 0.7,
        },
        { headers: { 'Authorization': `Bearer ${this.openaiApiKey}`, 'Content-Type': 'application/json' } }
      );
      return res.data.choices[0].message.content.trim();
    });
  }

  /* ─────────────────────────────────────────────────────
     RULE-BASED FALLBACK (no AI keys available)
  ───────────────────────────────────────────────────── */
  getRuleBasedResponse(message, context) {
    const lower = message.toLowerCase();
    const {
      name         = 'Student',
      averageScore = null,
      gpa          = null,
      attendance   = null,
      riskLevel    = null,
      subjects     = [],
    } = context;

    const avg  = averageScore ? Number(averageScore) : null;
    const att  = attendance   ? Number(attendance)   : null;
    const risk = riskLevel    || (avg == null ? null : avg >= 75 ? 'LOW' : avg >= 50 ? 'MEDIUM' : 'HIGH');

    // ── Analyse / performance overview ──────────────
    if (lower.includes('analys') || lower.includes('performance') || lower.includes('how am i doing')) {
      const parts = [];
      if (avg  != null) parts.push(`your average score is ${avg.toFixed(1)}%`);
      if (gpa  != null) parts.push(`GPA is ${Number(gpa).toFixed(2)}`);
      if (att  != null) parts.push(`attendance is ${att}%`);
      if (risk)         parts.push(`you are at ${risk} academic risk`);
      const summary = parts.length > 0 ? `Based on your data: ${parts.join(', ')}. ` : '';

      if (risk === 'HIGH')   return `${summary}${name}, your results are a serious concern. You need to attend all upcoming classes, submit outstanding assignments immediately, and dedicate at least 3 hours of focused study per day. Consider reaching out to your lecturer for extra help.`;
      if (risk === 'MEDIUM') return `${summary}${name}, you're in a middle position — there is real room to improve. Focus on your weaker subjects, aim for 2 hours of study per day, and improve your attendance if it's below 80%.`;
      return `${summary}${name}, you're performing well! Keep attending classes, stay on top of assignments, and challenge yourself with past exam papers to push your scores even higher.`;
    }

    // ── Prediction ───────────────────────────────────
    if (lower.includes('predict') || lower.includes('grade') || lower.includes('score next')) {
      if (avg == null) return `I don't have enough score data yet to predict your grade, ${name}. Once you have a few assessments recorded, I can give you a data-driven prediction.`;
      const predicted = Math.min(100, avg + (risk === 'LOW' ? 3 : risk === 'MEDIUM' ? -2 : -8));
      return `Based on your current average of ${avg.toFixed(1)}%, ${name}, you are on track for approximately ${predicted.toFixed(1)}% in your next assessment${risk === 'HIGH' ? ' — unless you take immediate action to improve attendance and study consistency' : risk === 'MEDIUM' ? '. Increasing your study time by 30 mins per day could push this to ' + (predicted + 5).toFixed(1) + '%' : '. Keep up the great work!'}.`;
    }

    // ── GPA improvement ──────────────────────────────
    if (lower.includes('gpa') || lower.includes('improve') || lower.includes('better')) {
      const gpaVal = gpa ? Number(gpa).toFixed(2) : avg ? Math.max(0, ((avg - 40) / 60) * 4.0).toFixed(2) : null;
      if (!gpaVal) return `To improve your GPA, ${name}: attend all classes, submit assignments on time, and review lecture notes within 24 hours of each session. Would you like a personalised study schedule?`;
      const target = Math.min(4.0, Number(gpaVal) + 0.5).toFixed(2);
      return `Your current GPA is ${gpaVal}, ${name}. To reach ${target}, focus on: (1) attending every class, (2) completing all assignments before deadlines, (3) identifying your two weakest subjects and spending an extra hour on each weekly. Review past exam papers to understand the marking pattern.`;
    }

    // ── Study tips ───────────────────────────────────
    if (lower.includes('study tip') || lower.includes('how to study') || lower.includes('study plan') || lower.includes('study schedule')) {
      const hoursNeeded = risk === 'HIGH' ? '3-4' : risk === 'MEDIUM' ? '2-3' : '1-2';
      return `${name}, here is a personalised approach for your ${risk || 'current'} performance level:\n• Study ${hoursNeeded} hours daily using the Pomodoro method (25 min on, 5 min break)\n• Review the previous day's notes before starting new material\n• Practice past exam questions every weekend\n${subjects.length > 0 ? `• Prioritise: ${subjects.slice(0, 2).join(' and ')}` : '• Focus on your weakest subjects first'}`;
    }

    // ── Attendance ────────────────────────────────────
    if (lower.includes('attendance') || lower.includes('absent') || lower.includes('class')) {
      if (att == null) return `Attendance is critical to academic success, ${name}. Aim for 90%+ — students who attend regularly score on average 15% higher on exams.`;
      if (att < 70) return `${name}, your attendance of ${att}% is critically low. Missing classes means missing explanations, examples, and exam hints that notes alone can't replace. Commit to attending every class for the next 4 weeks and watch your scores improve.`;
      if (att < 85) return `${name}, your attendance of ${att}% is acceptable but there's room to improve. Try to reach 90%+ — each missed class increases your risk of missing key exam content.`;
      return `Great attendance at ${att}%, ${name}! Keep it up — consistent attendance is one of the strongest predictors of academic success.`;
    }

    // ── Stress / exam anxiety ────────────────────────
    if (lower.includes('stress') || lower.includes('anxiet') || lower.includes('nervous') || lower.includes('exam')) {
      return `${name}, exam stress is normal — here's how to manage it:\n• Start revision at least 2 weeks before exams (not the night before)\n• Break your revision into small daily goals so it feels manageable\n• Get 7-8 hours of sleep — memory consolidation happens during sleep\n• Do 10 minutes of deep breathing before studying to improve focus\n${risk === 'HIGH' ? '• Since you are at high risk, speak to your academic advisor this week' : '• You have the foundation to do well — trust your preparation'}`;
    }

    // ── Subject-specific ─────────────────────────────
    if (lower.includes('subject') || lower.includes('focus on') || lower.includes('weak')) {
      if (subjects.length > 0) return `${name}, based on your enrolment in ${subjects.join(', ')}: focus your extra revision time on the subjects where your scores are lowest. Use past papers, attend lecturer office hours, and form study groups with classmates who are performing well.`;
      return `${name}, to identify which subjects need the most focus: check your grade breakdown in the Analytics section, then prioritise the bottom two. Spending even 30 extra minutes per day on your weakest subject can make a significant difference over a semester.`;
    }

    // ── Generic ──────────────────────────────────────
    return this.getGeneralResponse(name, risk);
  }

  getGeneralResponse(name = 'Student', risk = null) {
    const statsHint = risk ? `As a ${risk}-risk student, I'd recommend starting with "Analyse my performance" to get a personalised breakdown.` : '';
    return `Hi ${name}! I'm here to help with your academic journey. You can ask me:\n• "Analyse my performance" — for a data-driven overview\n• "How can I improve my GPA?" — for targeted strategies\n• "Predict my next grade" — for score forecasting\n• "Create a study plan" — for a personalised schedule\n• "How do I manage exam stress?" — for wellbeing tips\n${statsHint}`;
  }

  getPerformanceFallbackResponse(data) {
    const { studentName, gpa, attendance, completedAssignments, riskLevel } = data;
    if (riskLevel?.toLowerCase() === 'high')
      return `${studentName}, with a GPA of ${gpa} and ${attendance}% attendance, you are at high academic risk. You must attend every class, complete all outstanding assignments immediately, and study at least 3 hours daily. Book a meeting with your academic advisor this week.`;
    if (riskLevel?.toLowerCase() === 'medium')
      return `${studentName}, your GPA of ${gpa} shows there is clear room for improvement. Aim for 100% attendance, complete all assignments on time, and add 2 focused study hours per day targeting your weakest subjects.`;
    return `${studentName}, you are doing well with a GPA of ${gpa}! Keep up your ${attendance}% attendance, stay on top of assignments, and challenge yourself with past exam papers to push your performance even higher.`;
  }

  getFallbackResponse() {
    return "I'm having trouble connecting right now. Please try again in a moment, or ask about study tips, performance improvement, or exam strategies.";
  }
}

module.exports = new ChatbotService();