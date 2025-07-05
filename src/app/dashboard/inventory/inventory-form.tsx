"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Wand2 } from "lucide-react"

import { generateRecommendations } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryRecommendationsOutput } from "@/ai/flows/inventory-recommendations"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  salesHistory: z.string().min(10, "Please provide more detailed sales history."),
  currentStockLevels: z.string().min(10, "Please provide more detailed stock levels."),
  orderingConstraints: z.string().optional(),
})

export function InventoryForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<InventoryRecommendationsOutput | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesHistory: "",
      currentStockLevels: "",
      orderingConstraints: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setRecommendations(null)
    try {
      const result = await generateRecommendations(values)
      setRecommendations(result)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate recommendations. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Assistant</CardTitle>
          <CardDescription>
            Provide your sales and stock data to receive AI-powered reordering recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="salesHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Last 7 days: 20 Lattes, 15 Croissants..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Summarize recent sales history, including product names and quantities sold.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentStockLevels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock Levels</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Lattes: 30 units, Croissants: 10 units..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List the current stock level for each relevant product.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderingConstraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordering Constraints (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Minimum order of 50 units for coffee beans..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any budget limits, supplier minimums, or storage constraints.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Recommendations
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>
            Optimal reordering quantities will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Generating insights...</p>
            </div>
          ) : recommendations ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{recommendations.recommendations}</p>
            </div>
          ) : (
             <div className="text-center text-muted-foreground">
                <Wand2 className="mx-auto h-12 w-12" />
                <p className="mt-2">Your recommendations are waiting.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
