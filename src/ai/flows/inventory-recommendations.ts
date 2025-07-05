// src/ai/flows/inventory-recommendations.ts
'use server';
/**
 * @fileOverview Provides AI-powered recommendations for optimal inventory reordering quantities.
 *
 * - getInventoryRecommendations - A function that returns inventory recommendations.
 * - InventoryRecommendationsInput - The input type for the getInventoryRecommendations function.
 * - InventoryRecommendationsOutput - The return type for the getInventoryRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InventoryRecommendationsInputSchema = z.object({
  salesHistory: z.string().describe('A summary of recent sales history, including product names and quantities sold.'),
  currentStockLevels: z.string().describe('A summary of current stock levels for each product.'),
  orderingConstraints: z.string().optional().describe('Any constraints or limitations on ordering, such as minimum order quantities or budget limits.'),
});
export type InventoryRecommendationsInput = z.infer<typeof InventoryRecommendationsInputSchema>;

const InventoryRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('AI-powered recommendations for optimal reordering quantities for each product, considering sales history, stock levels, and ordering constraints.'),
});
export type InventoryRecommendationsOutput = z.infer<typeof InventoryRecommendationsOutputSchema>;

export async function getInventoryRecommendations(input: InventoryRecommendationsInput): Promise<InventoryRecommendationsOutput> {
  return inventoryRecommendationsFlow(input);
}

const inventoryRecommendationsPrompt = ai.definePrompt({
  name: 'inventoryRecommendationsPrompt',
  input: {schema: InventoryRecommendationsInputSchema},
  output: {schema: InventoryRecommendationsOutputSchema},
  prompt: `You are an AI assistant that helps business owners optimize their inventory reordering.

  Based on the provided sales history, current stock levels, and any ordering constraints, generate recommendations for the optimal reordering quantities for each product.

  Sales History: {{{salesHistory}}}
Current Stock Levels: {{{currentStockLevels}}}
Ordering Constraints: {{{orderingConstraints}}}

  Provide clear and concise recommendations that minimize stockouts and reduce excess inventory.
  Respond in the format specified by the InventoryRecommendationsOutputSchema schema.`, //Ensure valid json is returned
});

const inventoryRecommendationsFlow = ai.defineFlow(
  {
    name: 'inventoryRecommendationsFlow',
    inputSchema: InventoryRecommendationsInputSchema,
    outputSchema: InventoryRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await inventoryRecommendationsPrompt(input);
    return output!;
  }
);
