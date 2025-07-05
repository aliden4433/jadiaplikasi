"use client"

import { useState, useRef, useEffect } from "react"
import { FileUp, Loader2, Wand2 } from "lucide-react"

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
import { processSalesPdf } from "./actions"
import type { Product } from "@/lib/types"

interface SalesImportButtonProps {
  onImportSuccess: (products: Product[]) => void
}

export function SalesImportButton({ onImportSuccess }: SalesImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setTimeout(() => {
        setIsLoading(false)
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 200)
    }
  }, [isOpen])

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

    setIsLoading(true)

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        try {
          const pdfDataUri = reader.result as string
          const result = await processSalesPdf(pdfDataUri)

          if (result.productsForCart && result.productsForCart.length > 0) {
            onImportSuccess(result.productsForCart)
            setIsOpen(false)
          } else {
            toast({ variant: "destructive", title: "Tidak Ada Produk Ditemukan", description: "AI tidak dapat menemukan produk apa pun di PDF." })
          }
        } catch (e) {
            toast({
                variant: "destructive",
                title: "Error Ekstraksi AI",
                description: e instanceof Error ? e.message : "Terjadi kesalahan saat memproses PDF.",
            })
        } finally {
            setIsLoading(false)
        }
      }
      reader.onerror = (error) => {
        setIsLoading(false)
        console.error("File reading error:", error)
        throw new Error("Gagal membaca file.")
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.",
      })
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          Impor ke Keranjang
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impor Penjualan dari PDF</DialogTitle>
          <DialogDescription>
            Pilih file PDF yang berisi daftar produk untuk ditambahkan ke keranjang. Produk yang belum ada akan dibuat secara otomatis.
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
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Proses & Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
