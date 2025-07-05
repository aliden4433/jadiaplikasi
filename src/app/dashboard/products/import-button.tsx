"use client"

import { useState, useRef } from "react"
import { FileUp, Loader2 } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"

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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addProductsBatch } from "./actions"
import type { Product } from "@/lib/types"

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`

export function ImportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Error", description: "Silakan pilih file PDF terlebih dahulu." })
      return
    }

    setIsLoading(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise

      let allProducts: Omit<Product, "id">[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        const items = textContent.items.map(item => ({
            str: (item as any).str, 
            transform: (item as any).transform 
        }));
        
        const lineMap = new Map<number, any[]>()
        items.forEach(item => {
          const y = Math.round(item.transform[5])
          if (!lineMap.has(y)) {
            lineMap.set(y, [])
          }
          lineMap.get(y)!.push(item)
        });

        const sortedLines = Array.from(lineMap.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([, lineItems]) => 
            lineItems.sort((a, b) => a.transform[4] - b.transform[4]).map(item => item.str).join(" ").trim()
          );
        
        const productsOnPage = sortedLines.slice(1).map(line => {
          const parts = line.split(';').map(p => p.trim());
          if (parts.length < 5) return null;
          
          const name = parts[0];
          const description = parts[1];
          const price = parseFloat(parts[2].replace(/[^0-9,]/g, '').replace(',', '.'));
          const costPrice = parseFloat(parts[3].replace(/[^0-9,]/g, '').replace(',', '.'));
          const stock = parseInt(parts[4], 10);

          if (name && description && !isNaN(price) && !isNaN(costPrice) && !isNaN(stock)) {
            return { name, description, price, costPrice, stock };
          }
          return null;
        }).filter(p => p !== null) as Omit<Product, "id">[];
        
        allProducts.push(...productsOnPage);
      }
      
      if (allProducts.length === 0) {
        throw new Error("Tidak ada produk valid yang ditemukan di PDF. Pastikan formatnya benar: Nama; Deskripsi; Harga Jual; Harga Modal; Stok")
      }

      const result = await addProductsBatch(allProducts)

      if (result.success) {
        toast({ title: "Sukses", description: `${allProducts.length} produk berhasil diimpor.` })
        setIsOpen(false)
        setFile(null)
        if(fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(result.message)
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Impor",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengimpor PDF.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          Impor PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impor Produk dari PDF</DialogTitle>
          <DialogDescription>
            Pilih file PDF untuk mengimpor produk secara massal. Setiap baris harus berisi satu produk dengan format yang dipisahkan oleh titik koma (;).
            <br />
            <code className="font-mono text-sm">Nama;Deskripsi;Harga Jual;Harga Modal;Stok</code>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="pdf-file">File PDF</Label>
            <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={isLoading || !file}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Impor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
