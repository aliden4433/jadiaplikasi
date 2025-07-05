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
  salesHistory: z.string().min(10, "Harap berikan riwayat penjualan yang lebih detail."),
  currentStockLevels: z.string().min(10, "Harap berikan tingkat stok yang lebih detail."),
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
        description: "Tidak dapat menghasilkan rekomendasi. Silakan coba lagi.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Asisten Inventaris</CardTitle>
          <CardDescription>
            Berikan data penjualan dan stok Anda untuk menerima rekomendasi pemesanan ulang bertenaga AI.
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
                    <FormLabel>Riwayat Penjualan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 7 hari terakhir: 20 Latte, 15 Croissant..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ringkas riwayat penjualan terakhir, termasuk nama produk dan jumlah yang terjual.
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
                    <FormLabel>Tingkat Stok Saat Ini</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Latte: 30 unit, Croissant: 10 unit..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Sebutkan tingkat stok saat ini untuk setiap produk yang relevan.
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
                    <FormLabel>Batasan Pemesanan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Pesanan minimum 50 unit untuk biji kopi..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Sertakan batasan anggaran, minimum dari pemasok, atau batasan penyimpanan.
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
                Hasilkan Rekomendasi
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Rekomendasi AI</CardTitle>
          <CardDescription>
            Kuantitas pemesanan ulang yang optimal akan muncul di sini.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Menghasilkan wawasan...</p>
            </div>
          ) : recommendations ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{recommendations.recommendations}</p>
            </div>
          ) : (
             <div className="text-center text-muted-foreground">
                <Wand2 className="mx-auto h-12 w-12" />
                <p className="mt-2">Rekomendasi Anda sedang menunggu.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
