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
  salesHistory: z.string().describe('Ringkasan riwayat penjualan terakhir, termasuk nama produk dan jumlah terjual.'),
  currentStockLevels: z.string().describe('Ringkasan tingkat stok saat ini untuk setiap produk.'),
  orderingConstraints: z.string().optional().describe('Batasan atau larangan dalam pemesanan, seperti jumlah pesanan minimum atau batas anggaran.'),
});
export type InventoryRecommendationsInput = z.infer<typeof InventoryRecommendationsInputSchema>;

const InventoryRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Rekomendasi bertenaga AI untuk jumlah pemesanan ulang yang optimal untuk setiap produk, dengan mempertimbangkan riwayat penjualan, tingkat stok, dan batasan pemesanan.'),
});
export type InventoryRecommendationsOutput = z.infer<typeof InventoryRecommendationsOutputSchema>;

export async function getInventoryRecommendations(input: InventoryRecommendationsInput): Promise<InventoryRecommendationsOutput> {
  return inventoryRecommendationsFlow(input);
}

const inventoryRecommendationsPrompt = ai.definePrompt({
  name: 'inventoryRecommendationsPrompt',
  input: {schema: InventoryRecommendationsInputSchema},
  output: {schema: InventoryRecommendationsOutputSchema},
  prompt: `Anda adalah asisten AI yang membantu pemilik bisnis mengoptimalkan pemesanan ulang inventaris mereka.

  Berdasarkan riwayat penjualan yang diberikan, tingkat stok saat ini, dan batasan pemesanan apa pun, hasilkan rekomendasi untuk jumlah pemesanan ulang yang optimal untuk setiap produk.

  Riwayat Penjualan: {{{salesHistory}}}
Tingkat Stok Saat Ini: {{{currentStockLevels}}}
Batasan Pemesanan: {{{orderingConstraints}}}

  Berikan rekomendasi yang jelas dan ringkas yang meminimalkan kehabisan stok dan mengurangi kelebihan inventaris.
  Tanggapi dalam format yang ditentukan oleh skema InventoryRecommendationsOutputSchema.`,
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
