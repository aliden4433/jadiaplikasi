"use client"

import { useState, useRef, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileUp, Loader2, Wand2, Trash2, ArrowLeft, CheckCircle2, AlertTriangle, ChevronsUpDown, Check } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { processSalesPdfForReview, addOrUpdateProductsAndGetCartItems } from "./actions"
import type { CartItem, Product } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface SalesImportButtonProps {
  onImportSuccess: (items: CartItem[]) => void
  products: Product[]
}

type ImportStep = "upload" | "review" | "loading"

const reviewItemSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
  price: z.coerce.number().min(0, "Harga harus positif"),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  id: z.string().optional(),
  matchedProduct: z.custom<Product | null>().optional(),
});

const formSchema = z.object({
  items: z.array(reviewItemSchema),
})

export function SalesImportButton({ onImportSuccess, products }: SalesImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  })

  const { fields, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const setOpenState = (index: number, open: boolean) => {
    setOpenStates(prev => ({ ...prev, [index]: open }))
  }
  
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("upload")
        setFile(null)
        replace([])
        setOpenStates({})
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        form.reset()
      }, 200)
    }
  }, [isOpen, replace, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handlePdfExtraction = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Error", description: "Silakan pilih file PDF terlebih dahulu." })
      return
    }
    setStep("loading")
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        try {
          const pdfDataUri = reader.result as string
          const reviewData = await processSalesPdfForReview(pdfDataUri)

          if (reviewData.length > 0) {
            const formValues = reviewData.map(item => ({
                name: item.extractedName,
                price: item.matchedProduct?.price ?? item.extractedPrice,
                quantity: item.extractedQuantity,
                id: item.matchedProduct?.id,
                matchedProduct: item.matchedProduct,
            }));
            replace(formValues);
            setStep("review");
          } else {
            toast({ variant: "destructive", title: "Tidak Ada Produk Ditemukan", description: "AI tidak dapat menemukan produk apa pun di PDF." })
            setStep("upload")
          }
        } catch (e) {
            toast({
                variant: "destructive",
                title: "Error Ekstraksi AI",
                description: e instanceof Error ? e.message : "Terjadi kesalahan saat memproses PDF.",
            })
            setStep("upload")
        }
      }
      reader.onerror = (error) => {
        setStep("upload")
        console.error("File reading error:", error)
        throw new Error("Gagal membaca file.")
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.",
      })
      setStep("upload")
    }
  }

  const onFinalImport = async (data: z.infer<typeof formSchema>) => {
    setStep("loading")
    try {
      const result = await addOrUpdateProductsAndGetCartItems(data.items)
      if (result.length > 0) {
        onImportSuccess(result);
        toast({ title: "Sukses", description: `${result.length} item berhasil ditambahkan ke keranjang.` })
        setIsOpen(false)
      } else {
        throw new Error("Tidak ada produk valid untuk diimpor.")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Impor",
        description: error instanceof Error ? error.message : "Gagal memproses item.",
      })
      setStep("review")
    }
  }

  const isLoading = step === "loading"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          Impor ke Keranjang
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFinalImport)}>
            {step === "upload" && (
              <>
                <DialogHeader>
                  <DialogTitle>Impor Penjualan dari PDF</DialogTitle>
                  <DialogDescription>
                    Pilih file PDF yang berisi daftar produk untuk ditambahkan ke keranjang. Anda akan dapat meninjaunya sebelum impor.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="pdf-file-sales">File PDF</Label>
                    <Input id="pdf-file-sales" type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isLoading}>Batal</Button>
                  </DialogClose>
                  <Button onClick={handlePdfExtraction} disabled={isLoading || !file}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Proses dengan AI
                  </Button>
                </DialogFooter>
              </>
            )}

            {step === "review" && (
              <>
                <DialogHeader>
                  <DialogTitle>Tinjau Item Hasil Ekstraksi</DialogTitle>
                  <DialogDescription>
                    Berikut adalah item yang diekstraksi oleh AI. Tinjau, edit, atau hapus sebelum menambahkannya ke keranjang.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[50vh] pr-6">
                  <div className="space-y-6 py-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg relative bg-background">
                        <div className="flex items-center gap-3 mb-4">
                            {form.getValues(`items.${index}.id`) ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" /> : <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />}
                            <div className="flex-grow">
                                <h4 className="font-semibold">{form.getValues(`items.${index}.name`)}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {form.getValues(`items.${index}.id`) ? `Cocok dengan produk yang ada.` : `Akan dibuat sebagai produk baru.`}
                                </p>
                            </div>
                            {form.getValues(`items.${index}.id`) ? <Badge variant="secondary">Cocok</Badge> : <Badge variant="outline">Baru</Badge>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-3 flex flex-col">
                                <Label>Nama Produk</Label>
                                <Popover open={openStates[index] || false} onOpenChange={(open) => setOpenState(index, open)}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value || "Pilih atau ketik produk..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command
                                      filter={(value, search) => {
                                        if (value.toLowerCase().includes(search.toLowerCase())) return 1
                                        return 0
                                      }}
                                    >
                                      <CommandInput 
                                        placeholder="Cari produk..."
                                        value={field.value}
                                        onValueChange={(search) => {
                                          field.onChange(search);
                                          form.setValue(`items.${index}.id`, undefined);
                                          form.setValue(`items.${index}.matchedProduct`, null);
                                        }}
                                      />
                                      <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                      <CommandList>
                                        <CommandGroup>
                                          {products.map((product) => (
                                            <CommandItem
                                              value={product.name}
                                              key={product.id}
                                              onSelect={(currentValue) => {
                                                const selectedProduct = products.find(p => p.name.toLowerCase() === currentValue.toLowerCase());
                                                if (selectedProduct) {
                                                    form.setValue(`items.${index}.name`, selectedProduct.name);
                                                    form.setValue(`items.${index}.id`, selectedProduct.id);
                                                    form.setValue(`items.${index}.price`, selectedProduct.price);
                                                    form.setValue(`items.${index}.matchedProduct`, selectedProduct);
                                                }
                                                setOpenState(index, false);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  form.getValues(`items.${index}.id`) === product.id
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {product.name}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <Label>Jumlah</Label>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <Label>Harga Jual Satuan</Label>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                         <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStep("upload")} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                  </Button>
                  <Button type="submit" disabled={isLoading || fields.length === 0}>
                    {isLoading ? "Menambahkan..." : `Tambah ${fields.length} Item ke Keranjang`}
                  </Button>
                </DialogFooter>
              </>
            )}
            
            {step === "loading" && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">AI sedang bekerja... Mohon tunggu sebentar.</p>
                </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
