import { GoogleGenAI, Type } from "@google/genai";

// API key is now sourced from environment variables as per security best practices.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const createDynamicPrompt = (dangerTypes: string[]): string => {
    const dangerList = dangerTypes.length > 0 ? dangerTypes.join(', ') : 'any signs of distress';
    return `
Analyze the following audio clip from a public restroom for sounds of ${dangerList}.
Respond with a JSON object with two keys: "status" and "description".
- "status": Should be "DANGER" if distress is detected, otherwise "SAFE".
- "description": If status is "DANGER", provide a brief, clear description of the sound detected (e.g., "A loud scream was detected", "Sounds of a physical struggle"). If status is "SAFE", this should be an empty string.
Your response MUST be a valid JSON object.
`;
};


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        status: {
            type: Type.STRING,
            description: 'Either DANGER or SAFE',
        },
        description: {
            type: Type.STRING,
            description: 'A description of the danger, if any.',
        },
    },
    required: ['status', 'description'],
};

export interface AnalysisResult {
    status: 'DANGER' | 'SAFE';
    description: string | null;
}

export const analyzeAudioForDistress = async (base64Audio: string, mimeType: string, dangerTypes: string[]): Promise<AnalysisResult> => {
    try {
        const prompt = createDynamicPrompt(dangerTypes);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: mimeType,
                        },
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        const resultJson = JSON.parse(response.text);
        const status = resultJson.status?.toUpperCase();
        
        if (status === 'DANGER' || status === 'SAFE') {
            return {
                status,
                description: resultJson.description || null,
            };
        }
        
        console.warn(`Unexpected AI status response: "${status}". Defaulting to SAFE.`);
        return { status: 'SAFE', description: null };

    } catch (error) {
        console.error("Error analyzing audio with Gemini API:", error);
        // Re-throw the error to be handled by the caller component (App.tsx).
        // This allows the UI to show a proper error state instead of silently failing.
        throw error;
    }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};