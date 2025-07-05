'use server';
/**
 * @fileOverview Extracts product data from a PDF file using AI.
 *
 * - extractProducts - A function that handles the product extraction process.
 * - ExtractProductsInput - The input type for the extractProducts function.
 * - ExtractProductsOutput - The return type for the extractProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSchema = z.object({
  name: z.string().describe('The name of the product.'),
  description: z.string().describe('A brief description of the product.').optional(),
  price: z.coerce.number().describe('The selling price of the product.'),
  costPrice: z.coerce.number().describe('The cost price of the product.'),
  stock: z.coerce.number().int().describe('The current stock quantity of the product.'),
});

const ExtractProductsInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file containing a list of products, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractProductsInput = z.infer<typeof ExtractProductsInputSchema>;

const ExtractProductsOutputSchema = z.object({
  products: z.array(ProductSchema).describe('An array of products extracted from the PDF.'),
});
export type ExtractProductsOutput = z.infer<typeof ExtractProductsOutputSchema>;

export async function extractProducts(input: ExtractProductsInput): Promise<ExtractProductsOutput> {
  return extractProductsFlow(input);
}

const extractProductsPrompt = ai.definePrompt({
  name: 'extractProductsPrompt',
  input: {schema: ExtractProductsInputSchema},
  output: {schema: ExtractProductsOutputSchema},
  prompt: `You are an expert data entry specialist. Your task is to analyze the provided PDF document and extract all product listings.

  For each product, identify the following details:
  - Product Name
  - Description
  - Selling Price
  - Cost Price
  - Stock quantity (Note: if the PDF is a sales receipt, this field represents the quantity of items sold, not the stock level).

  The PDF may contain various formats, tables, or simple text lines. Your goal is to accurately parse this information. The prices might be formatted with currency symbols (like 'Rp' or '$') and thousands separators, which you should convert to a standard number format.

  It is crucial to ignore any text that is not a product listing. This includes headers, footers, page numbers, customer details, and especially order metadata. For example, if a line contains an order number (e.g., "Nomor Pesanan"), transaction details, or similar non-product information, it must be ignored.

  Return the extracted data as a JSON object that strictly conforms to the provided output schema. If a product is missing a specific field, use a sensible default (e.g., 0 for price/stock, or an empty string for description).

  PDF for analysis: {{media url=pdfDataUri}}`,
});

const extractProductsFlow = ai.defineFlow(
  {
    name: 'extractProductsFlow',
    inputSchema: ExtractProductsInputSchema,
    outputSchema: ExtractProductsOutputSchema,
  },
  async input => {
    const {output} = await extractProductsPrompt(input);
    if (!output) {
        return { products: [] };
    }
    return output;
  }
);
