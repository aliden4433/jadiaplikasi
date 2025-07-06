
"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { Upload, Loader2, ListChecks, FileWarning } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"
import { addProductsBatch } from "./actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ProductImportButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [parsedProducts, setParsedProducts] = useState<Omit<Product, "id">[]>([])
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setParsedProducts([])
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet) as any[]

        const productsToImport: Omit<Product, "id">[] = json.map((row) => {
          const normalizedRow: { [key: string]: any } = {}
          for (const key in row) {
            normalizedRow[key.toLowerCase().replace(/\s/g, '')] = row[key]
          }

          const name = normalizedRow['nama']
          const price = parseFloat(normalizedRow['hargajual'])
          const costPrice = parseFloat(normalizedRow['hargamodal'])
          const stock = parseInt(normalizedRow['stok'], 10)

          if (!name || isNaN(price) || isNaN(costPrice) || isNaN(stock)) {
            return null
          }

          return { name, price, costPrice, stock }
        }).filter((p): p is Omit<Product, "id"> => p !== null);


        if (productsToImport.length === 0 && json.length > 0) {
            toast({
                variant: "destructive",
                title: "Format File Salah",
                description: "Pastikan header kolom adalah 'nama', 'hargaJual', 'hargaModal', dan 'stok'."
            })
             setParsedProducts([])
        } else {
             setParsedProducts(productsToImport)
        }
       
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Gagal Membaca File",
          description: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses file.",
        })
        setParsedProducts([])
      }
    }
    reader.readAsBinaryString(file)
    event.target.value = '';
  }

  const handleImport = async () => {
    if (parsedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Tidak Ada Produk",
        description: "Tidak ada produk yang valid untuk diimpor.",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await addProductsBatch(parsedProducts)

      if (result.success) {
        toast({
            title: "Impor Berhasil",
            description: result.message,
        });
        setIsOpen(false)
        setParsedProducts([])
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Impor",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengimpor produk.",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setParsedProducts([]);
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Produk
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Produk dari File</DialogTitle>
          <DialogDescription>
            Pilih file Excel (.xlsx) atau CSV untuk mengimpor produk secara massal.
            Pastikan file Anda memiliki kolom: `nama`, `hargaJual`, `hargaModal`, `stok`.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          {parsedProducts.length > 0 ? (
            <>
              <h4 className="font-medium flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                Pratinjau Produk ({parsedProducts.length} item)
              </h4>
              <ScrollArea className="h-64 w-full rounded-md border">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead className="text-right">Harga Jual</TableHead>
                            <TableHead className="text-right">Harga Modal</TableHead>
                            <TableHead className="text-right">Stok</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parsedProducts.map((product, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.price)}</TableCell>
                                <TableCell className="text-right">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.costPrice)}</TableCell>
                                <TableCell className="text-right">{product.stock}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
              </ScrollArea>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <FileWarning className="w-10 h-10 mb-2" />
                <p>Belum ada file yang dipilih atau file tidak valid.</p>
                <p>Silakan pilih file untuk melihat pratinjau.</p>
             </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={isLoading || parsedProducts.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Mengimpor..." : `Import ${parsedProducts.length} Produk`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
