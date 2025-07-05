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
  stock: z.coerce.number().int().describe('The quantity of the product. For a sales receipt, this is the quantity sold. For a stock list, this is the quantity on hand.'),
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
  prompt: `You are an expert data entry specialist. Your primary task is to meticulously analyze the provided PDF document and extract a comprehensive list of all products.

  For each product found, you must identify and extract the following details:
  - **Product Name**: The full name of the product.
  - **Description**: A brief description if available.
  - **Selling Price**: The price at which the product is sold.
  - **Cost Price**: The cost price or modal price of the product, if available.
  - **Stock/Quantity**: This is a crucial field. You must accurately identify the quantity of the item. This could be explicitly labeled as 'Jumlah', 'Qty', 'Quantity', or be an implicit number next to the item name. If the PDF is a sales receipt or invoice, this field represents the **quantity of items sold**. If it's a stock list, it represents the stock on hand.

  **CRITICAL INSTRUCTIONS:**
  1.  **Extract ALL Products**: Do not miss any product. Go through the document line by line, table by table.
  2.  **Accurate Quantity**: Pay very close attention to extracting the correct quantity for each product. This is often the most important piece of information.
  3.  **Numerical Conversion**: Prices and quantities may have currency symbols (e.g., 'Rp', '$') or thousands separators (dots or commas). You must convert these into standard numerical values (e.g., "Rp15.000" becomes 15000).
  4.  **Ignore Non-Product Data**: It is extremely important that you **ignore** any text that is not a product listing. This includes, but is not limited to:
      - Headers, footers, page numbers.
      - Customer names, addresses, phone numbers.
      - Order metadata like "Nomor Pesanan", "Invoice Number", "Transaction ID", "Date".
      - Summary totals, tax information, shipping costs.
  5.  **Schema Conformance**: Return the extracted data as a JSON object that strictly conforms to the provided output schema. If a field is missing for a product, use a sensible default (e.g., 0 for price/stock, or an empty string for description).

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
