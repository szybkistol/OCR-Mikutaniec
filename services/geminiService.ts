
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { SchemaField, AggregatedResult } from '../types';

// Ensure API Key is present
if (!process.env.API_KEY) {
  console.error("Missing API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      // Handle different base64 formats (data:image/...;base64, vs raw)
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Construct the JSON Schema based on user definition
// Now constructs a nested object for each field: { value: ..., source: ... }
const buildResponseSchema = (fields: SchemaField[]): Schema => {
  const properties: Record<string, Schema> = {};
  
  fields.forEach(field => {
    let valueType = Type.STRING;
    if (field.type === 'number') valueType = Type.NUMBER;
    // Dates are strings in JSON
    
    properties[field.name] = {
      type: Type.OBJECT,
      properties: {
        value: {
          type: valueType,
          description: field.description || `The ${field.name} found in the context.`,
          nullable: true
        },
        source: {
          type: Type.STRING,
          description: "The filename (e.g., 'contract.pdf') or specific context where this data was found.",
          nullable: true
        }
      },
      required: ["value", "source"]
    };
  });

  return {
    type: Type.OBJECT,
    properties: properties,
    required: fields.map(f => f.name),
  };
};

export const extractDataFromFiles = async (files: File[], fields: SchemaField[]): Promise<AggregatedResult> => {
  const modelName = 'gemini-2.5-flash'; // Using Flash for large context window and multimodal support
  const responseSchema = buildResponseSchema(fields);
  
  try {
    // Convert all files to generative parts concurrently
    const fileParts = await Promise.all(files.map(fileToGenerativePart));
    
    // Construct a specific prompt based on the schema to help the model
    const fieldDescriptions = fields.map(f => 
      `- ${f.name} (${f.type}): ${f.description || 'Extract value'}`
    ).join('\n');

    const fileList = files.map(f => f.name).join(', ');

    const prompt = `
      You are an expert data analyst and extraction AI.
      
      TASK:
      Analyze ALL the provided files collectively (documents, images, audio) as a single context. 
      Aggregate the information found across these different sources to populate the requested data fields.
      
      For every single field, you MUST provide:
      1. The extracted 'value'.
      2. The 'source' - strictly the name of the file where this specific piece of data was found. If derived from multiple, list them.
      
      Files provided: ${fileList}
      
      Fields to extract:
      ${fieldDescriptions}
      
      Rules:
      1. If a field is not found in ANY of the files, set 'value' to null and 'source' to null.
      2. For 'date' types, strictly use YYYY-MM-DD format.
      3. For 'number' types, remove currency symbols and return raw numbers.
      4. Be precise. If the file is an audio file, listen to the content to extract data.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        // Send all file parts + the text prompt in a single message
        parts: [...fileParts, { text: prompt }]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    // The SDK returns the text directly in response.text
    const jsonText = response.text;
    
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    const parsedData = JSON.parse(jsonText);

    return {
      status: 'success',
      data: parsedData
    };

  } catch (error: any) {
    console.error(`Error processing files:`, error);
    return {
      status: 'error',
      data: {},
      error: error.message || "Extraction failed"
    };
  }
};
