import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: "AIzaSyCVYLTiI7hau0iOhpUuX67F4PY_Ou44OyE"})],
  model: 'googleai/gemini-2.0-flash',
});
