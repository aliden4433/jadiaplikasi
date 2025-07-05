"use server"

import { getInventoryRecommendations } from "@/ai/flows/inventory-recommendations"
import type { InventoryRecommendationsInput, InventoryRecommendationsOutput } from "@/ai/flows/inventory-recommendations"

export async function generateRecommendations(
  input: InventoryRecommendationsInput
): Promise<InventoryRecommendationsOutput> {
  try {
    const result = await getInventoryRecommendations(input)
    return result
  } catch (error) {
    console.error("Error generating recommendations:", error)
    throw new Error("Gagal membuat rekomendasi inventaris.")
  }
}
