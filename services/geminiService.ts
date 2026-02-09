
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MessageRole, UserCareerProfile, LearningPath, LearningTopic, LessonBlocker, TopicChat, ResumeAnalysis } from "../types";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeAIParse = (text: string | undefined, fallback: any = {}) => {
  if (!text) return fallback;
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    let healed = cleaned;
    const quoteCount = (healed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) healed += '"';
    const openBraces = (healed.match(/\{/g) || []).length;
    const closeBraces = (healed.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) healed += '}';
    const openBrackets = (healed.match(/\[/g) || []).length;
    const closeBrackets = (healed.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBraces; i++) healed += ']';
    try {
      return JSON.parse(healed);
    } catch (innerE) {
      return fallback;
    }
  }
};

export const geminiService = {
  // Main career advisor chat session.
  async chat(messages: { role: string; content: string }[], profile?: UserCareerProfile) {
    const model = 'gemini-3-pro-preview';
    let context = "You are Sanvii.AI, a high-end career advisor. Provide professional, encouraging, and deeply insightful advice.";
    if (profile && profile.onboarding_completed) {
      context += `\n\nUser Context:\nRole: ${profile.job_role}\nTargets: ${profile.target_roles.join(', ')}\nSkills: ${profile.skills.map(s => s.name).join(', ')}`;
    }
    const contents = messages.map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    const response = await ai.models.generateContent({
      model,
      contents: contents as any,
      config: { systemInstruction: context, temperature: 0.7, maxOutputTokens: 2048 }
    });
    return response.text || "I'm sorry, I couldn't process that.";
  },

  // Search for real-time jobs using Google Search grounding.
  async findJobs(profile: UserCareerProfile) {
    const model = 'gemini-3-pro-preview';
    const target = profile.target_roles[0] || 'Software Engineer';
    const userSkills = profile.skills.map(s => s.name).join(', ');
    
    const prompt = `Search for 3-4 real-time job openings for the role of "${target}". 
    The candidate has these skills: ${userSkills}. 
    Compare the candidate to these jobs and provide a match percentage and a list of missing skills for each.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `Return a structured JSON list of jobs. 
        Each job object must have: id, title, company, location, matchPercentage (number), missingSkills (array), and sourceUrl.
        Ensure you only return real, current jobs found via search.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              matchPercentage: { type: Type.NUMBER },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              sourceUrl: { type: Type.STRING }
            },
            required: ["id", "title", "company", "location", "matchPercentage", "missingSkills", "sourceUrl"]
          }
        }
      }
    });

    const jobs = safeAIParse(response.text, []);
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { jobs, grounding };
  },

  // Interactive tutor for specific learning topics.
  async lessonTutorChat(
    topic: LearningTopic, 
    messages: { role: string; content: string }[], 
    activeBlockers: LessonBlocker[] = [],
    profile: UserCareerProfile,
    mode: 'learning' | 'revision' | 'skill-check' = 'learning'
  ) {
    const model = 'gemini-3-flash-preview';
    
    const unresolvedBlockers = activeBlockers.filter(b => !b.resolved);
    const blockerContext = unresolvedBlockers.length > 0 
      ? `\nCURRENT LEARNING BLOCKERS: ${unresolvedBlockers.map(b => b.text).join(', ')}. Keep these in mind while explaining.`
      : "";

    const profileContext = `\nSTUDENT PROFILE: Currently a ${profile.job_role || 'Learner'}, aiming for ${profile.target_roles.join(' or ')}. Their skills include ${profile.skills.map(s => s.name).join(', ')}. Use analogies relevant to their background where possible.`;

    let systemInstruction = `You are a dedicated AI Tutor for: "${topic.title}".
    TEACHING SCOPE: ${topic.description}
    MODE: ${mode.toUpperCase()}
    ${blockerContext}${profileContext}
    STRICT TOPIC ADHERENCE RULE: ONLY answer questions directly related to "${topic.title}". Refuse out-of-scope queries politely.
    If stuck, start with #BLOCKER_DETECTED. If mastered, suggest #READY_FOR_VALIDATION. Use Markdown, QUESTION: [Question], OPTIONS: [A, B].`;

    const contents = messages.map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model,
      contents: contents as any,
      config: { systemInstruction, temperature: 0.7 }
    });
    return response.text || "I'm here to help with the current module.";
  },

  async generateSkillCheck(topic: LearningTopic) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a skill check for: "${topic.title}". Concept: ${topic.description}.`,
      config: {
        systemInstruction: "Generate exactly 3 challenging multiple-choice or short answer validation questions. Format clearly.",
        responseMimeType: "application/json",
        responseSchema: { 
          type: Type.OBJECT,
          properties: {
            questions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["questions"]
        }
      }
    });
    return safeAIParse(response.text, { questions: [] }).questions;
  },

  async evaluateSkillCheck(topic: LearningTopic, chatHistory: any[]) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Evaluate the user's mastery of "${topic.title}" based on our session history.`,
      config: {
        systemInstruction: `Analyze the conversation. 
        Determine if the student truly understands the concept or just repeated info. 
        Return JSON structure: { passed: boolean, score: number, feedback: string, weakConcepts: string[], actionableAdvice: string }`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passed: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            weakConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableAdvice: { type: Type.STRING }
          },
          required: ["passed", "score", "feedback", "weakConcepts", "actionableAdvice"]
        }
      }
    });
    return safeAIParse(response.text, { passed: false, score: 0, feedback: "Evaluation unavailable.", weakConcepts: [], actionableAdvice: "" });
  },

  async getLearningSuggestions(profile: UserCareerProfile) {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Suggest 3 high-impact learning path titles and short descriptions for someone who is a ${profile.job_role} and wants to become a ${profile.target_roles.join(', ')}. Use their current skills: ${profile.skills.map(s => s.name).join(', ')}.`,
      config: {
        systemInstruction: "You are an AI Career Strategist. Provide ultra-relevant, growth-oriented learning path suggestions in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              estimatedTime: { type: Type.STRING }
            },
            required: ["title", "description", "reasoning", "estimatedTime"]
          }
        }
      }
    });
    return safeAIParse(response.text, []);
  },

  async generateLearningPath(goal: string, description: string, profile?: UserCareerProfile, options?: { scope?: string; timeline?: string; technologies?: string; useProfile?: boolean }): Promise<any> {
    const model = 'gemini-3-flash-preview';
    let userContext = `Goal: ${goal}\nContext: ${description}\nTimeline: ${options?.timeline || '6'} months`;
    if (options?.useProfile && profile) userContext += `\nCurrent Skills: ${profile.skills.map(s => s.name).join(', ')}`;
    
    const response = await ai.models.generateContent({
      model,
      contents: `Design an expert curriculum for: "${goal}".\n\n${userContext}.`,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: "You are a Master Curriculum Architect. Generate a learning roadmap in JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            goal_role: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        estimated_minutes: { type: Type.NUMBER },
                        difficulty_level: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return safeAIParse(response.text, {});
  },

  async analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze this resume deeply: ${resumeText}`,
      config: {
        systemInstruction: `You are an expert HR recruiter and career strategist. 
        Perform a deep analysis. Extract skills, roles, keywords (for ATS), specific improvement areas, 
        and high-impact actionable recommendations for career growth.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            extracted_roles: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvement_areas: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionable_recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  advice: { type: Type.STRING }
                },
                required: ["category", "advice"]
              }
            }
          },
          required: ["skills", "extracted_roles", "suggestions", "keywords", "improvement_areas", "actionable_recommendations"]
        }
      }
    });
    return safeAIParse(response.text, { 
      skills: [], extracted_roles: [], suggestions: [], keywords: [], improvement_areas: [], actionable_recommendations: [] 
    });
  }
};
