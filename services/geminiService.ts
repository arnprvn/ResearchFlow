
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    let lastError: Error | undefined;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (i < retries - 1) {
                const backoffDelay = delay * Math.pow(2, i);
                console.warn(`API call failed, attempt ${i + 1}. Retrying in ${backoffDelay}ms...`, error.message);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
        }
    }
    console.error("All retry attempts failed for API call.");
    throw lastError;
};

const systemInstructionTemplate = `You are RESEARCH PAPER GENERATION, a professional academic writing application.

Your task is to generate a complete, original, plagiarism-free research paper of approximately {WORD_COUNT} words based on the topic provided by the user.

**Writing Rules:**
- Use formal academic English.
- Write in a third-person, research-oriented tone.
- The content must be human-like, clear, and well-structured.
- Do NOT mention AI, prompts, or the generation process in the output.
- The paper should be suitable for engineering students, final-year projects, seminars, and assignments.
{IMAGE_INSTRUCTION}
**Mandatory Research Paper Structure:**
The final output must be a single block of text formatted with markdown-style headers (e.g., # Title, ## Abstract, ### Keywords). Use standard markdown for lists.

# 1. Title
- Technical and research-focused.

## 2. Abstract
- 150–180 words.
- Include: Problem background, Objective, Proposed approach, Expected outcome.

### 3. Keywords
- 5–7 relevant technical terms, separated by commas.

## 3. Table of Contents

<!-- TOC -->

## 4. Introduction
- Background of the research area.
- Motivation and importance.
- Objectives of the study.

## 5. Literature Review
- Summary of existing research works.
- Limitations of current approaches.
- Identified research gap.

## 6. Problem Statement
- Clearly define the problem being addressed.

## 7. Proposed Methodology
- Conceptual system design or workflow.
- High-level explanation of tools, techniques, or models used.

## 8. Results and Discussion
- Expected or simulated results.
- Performance analysis and potential benefits.

## 9. Advantages and Limitations
- Use bullet points for advantages.
- Use bullet points for limitations.

## 10. Conclusion and Future Scope
- Summary of contributions.
- Future enhancements and research directions.

## 11. References
- 5–7 references.
- Use IEEE citation style (e.g., [1], [2]).
- References should be realistic and properly formatted academic citations (books, journal articles, conference papers). Do not include fake links or DOIs.

**Constraints:**
- The total length must be approximately {WORD_COUNT} words.
- Maintain a logical flow between all sections.
- Avoid repetition and filler content.
- Adapt automatically to the domain of the given topic.
- Ensure the entire output is a single, continuous text document.
`;

const IMAGE_PLACEHOLDER_INSTRUCTION = `
- Where appropriate, insert image placeholders in the format [IMAGE: A clear, descriptive prompt for a technical diagram, chart, or concept illustration relevant to the surrounding text]. For example: [IMAGE: A flowchart of the proposed algorithm for data processing]. Place these on their own line.
- Aim for 2-3 relevant images for a paper up to 10 pages, and more for longer papers.
`;

async function generateImage(prompt: string): Promise<string> {
    try {
        const generate = () => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Generate a technical, academic-style image for a research paper: ${prompt}` }]
            },
        });

        const response = await withRetry(generate);

        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64String = part.inlineData.data;
                    return `data:image/png;base64,${base64String}`;
                }
            }
        }
        throw new Error("No image data found in response.");
    } catch (error) {
        console.error(`Failed to generate image for prompt "${prompt}":`, error);
        return ""; // Return empty string on failure to not break the paper flow
    }
}

export async function* generatePaperStream(topic: string, numPages: number, includeImages: boolean, enableThinking: boolean): AsyncGenerator<string> {
    try {
        const wordCount = numPages * 250;
        const imageInstruction = includeImages ? IMAGE_PLACEHOLDER_INSTRUCTION : '';
        const systemInstruction = systemInstructionTemplate
            .replace(/{WORD_COUNT}/g, wordCount.toString())
            .replace('{IMAGE_INSTRUCTION}', imageInstruction);
        
        const config: any = {
            systemInstruction: systemInstruction,
        };

        if (enableThinking) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3-pro-preview',
            contents: `Generate a research paper on the topic: "${topic}"`,
            config: config
        });

        let textBuffer = '';
        const imageRegex = /\[IMAGE:\s*(.*?)\]/g;

        for await (const chunk of responseStream) {
            if (chunk.text) {
                textBuffer += chunk.text;

                if (includeImages) {
                    let match;
                    let lastIndex = 0;
                    while ((match = imageRegex.exec(textBuffer)) !== null) {
                        const precedingText = textBuffer.substring(lastIndex, match.index);
                        if (precedingText) {
                            yield precedingText;
                        }
                        
                        const imagePrompt = match[1].trim();
                        yield `\n*Generating image: ${imagePrompt}...*\n`;
                        const imageUrl = await generateImage(imagePrompt);
                        if (imageUrl) {
                            yield `![${imagePrompt}](${imageUrl})\n`;
                        } else {
                            yield `\n*Image generation failed for: ${imagePrompt}*\n`;
                        }
                        lastIndex = match.index + match[0].length;
                    }
                    textBuffer = textBuffer.substring(lastIndex);
                }
            }
        }
        if (textBuffer) {
            yield textBuffer;
        }

    } catch (error) {
        console.error("Error generating paper:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to communicate with the Gemini API.");
    }
};

export const suggestTopics = async (keyword: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `Suggest exactly 4 specific and technical research paper topics about "${keyword}" for university students.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: 'A single research paper topic suggestion'
                            }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) {
             throw new Error("Received an empty response for topic suggestions.");
        }

        const parsed = JSON.parse(text);
        if (parsed.topics && Array.isArray(parsed.topics)) {
            return parsed.topics;
        }
        
        throw new Error("Invalid format for topic suggestions.");

    } catch (error) {
        console.error("Error suggesting topics:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to generate topic suggestions.");
    }
};

type ChatImage = {
  data: string; // base64 string
  mimeType: string;
};

export const chatWithGemini = async (prompt: string, image: ChatImage | null): Promise<string> => {
  try {
    const parts: any[] = [];
    
    if (image) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }
    parts.push({ text: prompt });

    const generate = () => ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: parts },
    });
    
    const response = await withRetry(generate);

    const text = response.text;
    if (text) {
        return text;
    }
    throw new Error("Received an empty response from the chatbot.");

  } catch (error) {
    console.error("Error in chatWithGemini:", error);
    // Return a more user-friendly error message instead of the raw error object.
    return "Sorry, I'm having trouble connecting. Please try again in a moment.";
  }
};
