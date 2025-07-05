"use client"

import { useState, useRef, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileUp, Loader2, Wand2, Trash2, ArrowLeft } from "lucide-react"

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
import { addProductsBatch, extractProducts } from "./actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"

type ImportStep = "upload" | "review" | "loading"

const productSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
})

const formSchema = z.object({
  products: z.array(productSchema),
})

export function ImportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      products: [],
    },
  })

  const { fields, remove, replace } = useFieldArray({
    control: form.control,
    name: "products",
  })
  
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("upload")
        setFile(null)
        replace([])
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
          const result = await extractProducts(pdfDataUri)

          if (result.products && result.products.length > 0) {
            replace(result.products)
            setStep("review")
          } else {
            toast({ variant: "destructive", title: "Tidak Ada Produk Ditemukan", description: "AI tidak dapat menemukan produk apa pun di PDF. Pastikan formatnya jelas." })
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
      const result = await addProductsBatch(data.products)
      if (result.success) {
        toast({ title: "Sukses", description: `${data.products.length} produk berhasil diimpor.` })
        setIsOpen(false)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Impor",
        description: error instanceof Error ? error.message : "Gagal menyimpan produk.",
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
          Impor PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFinalImport)}>
            {step === "upload" && (
              <>
                <DialogHeader>
                  <DialogTitle>Impor Produk dengan AI</DialogTitle>
                  <DialogDescription>
                    Pilih file PDF untuk diekstraksi menggunakan AI. AI akan membaca detail produk dari file.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="pdf-file">File PDF</Label>
                    <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Batal</Button>
                  </DialogClose>
                  <Button onClick={handlePdfExtraction} disabled={isLoading || !file}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Wand2 className="mr-2 h-4 w-4" />
                    Proses dengan AI
                  </Button>
                </DialogFooter>
              </>
            )}

            {step === "review" && (
              <>
                <DialogHeader>
                  <DialogTitle>Tinjau Produk Hasil Ekstraksi</DialogTitle>
                  <DialogDescription>
                    Berikut adalah produk yang diekstraksi oleh AI. Tinjau, edit, atau hapus sebelum mengimpor.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[50vh] pr-6">
                  <div className="space-y-6 py-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`products.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <Label>Nama Produk</Label>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`products.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <Label>Harga Jual</Label>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`products.${index}.costPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <Label>Harga Modal</Label>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name={`products.${index}.stock`}
                            render={({ field }) => (
                              <FormItem>
                                <Label>Stok</Label>
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
                    {isLoading ? "Mengimpor..." : `Impor ${fields.length} Produk`}
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
