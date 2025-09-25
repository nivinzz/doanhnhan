import { GoogleGenAI, Type } from "@google/genai";
import type { StoryData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type LoadingMessageSetter = (message: string) => void;

export const generateEntrepreneurStoryAndImage = async (setLoadingMessage: LoadingMessageSetter): Promise<StoryData> => {
    // 1. Get a random entrepreneur, story idea, and a generic image prompt description.
    // Using a generic description for the image prompt avoids potential issues with generating
    // images of specific, real people, which can be restricted.
    setLoadingMessage('Đang tìm một doanh nhân truyền cảm hứng...');
    const ideaResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate the name of a world-famous entrepreneur (e.g., Steve Jobs, Elon Musk, Oprah Winfrey), a brief, visually compelling anecdote about them, and a generic description for an image prompt. The image prompt description should capture the essence of the anecdote without using the entrepreneur's name. Focus on a specific moment of inspiration, challenge, or breakthrough.

Example Output:
{
  "name": "Marie Curie",
  "storyIdea": "Working late in her cluttered laboratory, discovering the glowing properties of radium.",
  "imagePromptDescription": "A pioneering female scientist in a dimly lit, turn-of-the-century laboratory, looking with wonder at a beaker containing a substance that is glowing with an ethereal blue light."
}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'The full name of the entrepreneur.' },
                    storyIdea: { type: Type.STRING, description: 'A short, one-sentence description of a famous story or anecdote about them. This will be used to generate a full story.' },
                    imagePromptDescription: { type: Type.STRING, description: "A generic description of the scene for an image prompt that captures the essence of the story idea but avoids using the entrepreneur's specific name." }
                },
                required: ['name', 'storyIdea', 'imagePromptDescription']
            },
        },
    });

    const ideaData = JSON.parse(ideaResponse.text);
    const { name, storyIdea, imagePromptDescription } = ideaData;

    setLoadingMessage(`Đang viết câu chuyện về ${name}...`);

    // 2. Generate the full story in Vietnamese based on the specific idea
    const storyResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Viết một câu chuyện ngắn, truyền cảm hứng bằng tiếng Việt về ${name}, tập trung vào khoảnh khắc cụ thể này: "${storyIdea}". Làm cho nó hấp dẫn, được viết tốt và dài khoảng 150-200 từ. Không sử dụng định dạng markdown.`,
        config: {
            temperature: 0.8
        }
    });
    const fullStory = storyResponse.text.trim();

    setLoadingMessage(`Đang tạo hình minh họa cho câu chuyện của ${name}...`);

    // 3. Generate the image based on the generic description to ensure higher success rate
    const imagePrompt = `${imagePromptDescription}. Style: cinematic, high-quality digital art, detailed, slightly stylized, dramatic lighting, epic.`;

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imagePrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    if (!imageResponse.generatedImages || imageResponse.generatedImages.length === 0) {
        // Even with the fix, if it fails, provide a more specific error.
        throw new Error('Image generation failed. The model may have refused to generate the image for safety reasons.');
    }

    const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    return {
        entrepreneurName: name,
        story: fullStory,
        imageUrl: imageUrl,
    };
};