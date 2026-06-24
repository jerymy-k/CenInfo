import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const systemInstruction = `You are CenInfo AI, an expert movie and TV series recommendation assistant. Your goal is to provide fun, engaging, and accurate movie recommendations based on user requests.

CRITICAL INSTRUCTION: You MUST ALWAYS return your response in the following strict JSON schema. Do not include any other text outside the JSON.
{
  "text": "Your conversational response to the user here.",
  "recommended_movies": ["Movie Title (Year)", "Another Movie Title (Year)"]
}

Rules:
1. Always include a friendly, conversational message in the "text" field.
2. If you are recommending movies, put their exact titles and release years in the "recommended_movies" array (e.g. ["The Matrix (1999)", "Inception (2010)"]).
3. The format "Movie Title (Year)" is extremely important for the search algorithm to find the correct movie.
4. Limit recommendations to a maximum of 3 movies per response.
5. If the user is just saying hello or you have no recommendations yet, leave the array empty [].`;

let model = null;
if (genAI) {
  model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ]
  });
}

export async function chatWithCenInfo(history, newMessage) {
  if (!API_KEY || !model) {
    return {
      text: "API Key missing! Please add `VITE_GEMINI_API_KEY` to your `.env` file to activate me.",
      recommended_movies: []
    };
  }

  try {
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      // We must only pass the "text" portion of the AI's previous JSON responses to history, 
      // or else we pass back a stringified JSON. The user's message is a simple string.
      parts: [{ text: msg.role === 'ai' ? JSON.stringify({text: msg.text, recommended_movies: msg.recommended_movies || []}) : msg.text }],
    }));

    // Gemini API requires the history array to start with a 'user' role.
    // If the history starts with our hardcoded AI greeting, remove it.
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chatSession = model.startChat({
      history: formattedHistory,
    });

    const result = await chatSession.sendMessage(newMessage);
    const responseText = result.response.text().trim();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("AI Chat Error:", error);
    return {
      text: "Sorry, I ran into an error connecting to my server. Please try again.",
      recommended_movies: []
    };
  }
}
