import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { INITIAL_PROMPT_CONTEXT } from "../constants";
import { Itinerary, DayPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for structured itinerary generation (kept for reference or full regen if needed)
const itinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          dayNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                location: { type: Type.STRING },
                icon: { type: Type.STRING },
                transportSuggestion: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  }
};

// Tool definition for updating itinerary
export const updateItineraryTool: FunctionDeclaration = {
  name: 'update_itinerary_activity',
  description: 'Update the details of a specific activity in the itinerary or add a new one.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      dayNumber: { type: Type.INTEGER, description: "The day number (1-4) to update." },
      activityTitleToFind: { type: Type.STRING, description: "The title of the existing activity to update. If empty, a new activity might be added." },
      newDetails: {
        type: Type.OBJECT,
        description: "The new details for the activity.",
        properties: {
          time: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          location: { type: Type.STRING },
          icon: { type: Type.STRING },
          transportSuggestion: { type: Type.STRING }
        }
      }
    },
    required: ['dayNumber', 'newDetails']
  }
};

export const generateTripItinerary = async (): Promise<Itinerary> => {
   // Legacy method, we are using hardcoded constants now, but keeping for backup
   return {} as Itinerary;
};

// Function to recalculate transport times for a specific day
export const recalculateDayTransport = async (dayPlan: DayPlan): Promise<DayPlan> => {
  const prompt = `
    Context: A day trip in Okinawa (or Taiwan transit).
    Current Plan: ${JSON.stringify(dayPlan)}
    
    Task: Review the 'transportSuggestion' for each activity. 
    1. Calculate precise travel times between the previous location and the current location.
    2. Use "Monorail (Yui Rail)" or "Walking" as primary modes in Okinawa.
    3. Use "Train", "HSR", "MRT" for Taiwan parts (Day 1 start, Day 4 end).
    4. Provide specific train numbers if possible (e.g. "區間車 2133").
    5. Return the FULL updated DayPlan JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // reusing the day schema structure partially
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING },
                dayNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                activities: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            time: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            location: { type: Type.STRING },
                            icon: { type: Type.STRING },
                            transportSuggestion: { type: Type.STRING }
                        }
                    }
                }
            }
        },
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as DayPlan;
  } catch (error) {
    console.error("Error recalculating transport:", error);
    throw error;
  }
};

export const analyzePhoto = async (base64Image: string, promptText: string = "Describe this image and how it relates to Okinawa tourism.") => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Context: I am traveling to Okinawa. Reply in Traditional Chinese. ${promptText}` }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing photo:", error);
    throw error;
  }
};

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: INITIAL_PROMPT_CONTEXT + " You can help users update their itinerary using the `update_itinerary_activity` tool. Be helpful and enthusiastic.",
      tools: [{ functionDeclarations: [updateItineraryTool] }],
    }
  });
};
