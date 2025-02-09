import OpenAI from 'openai';

if (!process.env.REACT_APP_OPENAI_API_KEY) {
  throw new Error('OpenAI API key is not set in environment variables. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
}

export const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development, use backend proxy in production
});
