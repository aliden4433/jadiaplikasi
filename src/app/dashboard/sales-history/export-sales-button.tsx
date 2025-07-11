
"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { FileDown } from "lucide-react"
import { format } from "date-fns"

import type { Sale, Expense } from "@/lib/types"
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

interface ExportSalesButtonProps {
  sales: Sale[]
  expenses: Expense[]
  disabled?: boolean
}

export function ExportSalesButton({ sales, expenses, disabled }: ExportSalesButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filename, setFilename] = useState("Laporan_Laba_Rugi_dan_Pengeluaran")

  const handleExport = () => {
    // 1. Define Sales Headers
    const salesHeaders = [
      "No Transaksi",
      "Tanggal",
      "Dept.",
      "Kode Pel.",
      "Nama Pelanggan",
      "Sub Total",
      "Total Pokok",
      "Laba Kotor",
      "Biaya Msk Total (+)",
      "Diskon",
      "Biaya Lain",
      "Laba Jual",
    ]

    // 2. Map Sales Data to Rows
    const salesData = sales.map((sale) => {
      const labaKotor = sale.subtotal - sale.totalCost
      return [
        sale.transactionId || sale.id,
        format(new Date(sale.date), "M/d/yyyy"),
        "UTM", // Placeholder
        "PL0001", // Placeholder
        "SHOPEE", // Placeholder
        sale.subtotal,
        sale.totalCost,
        labaKotor,
        0, // Biaya Msk Total
        sale.discount,
        0, // Biaya Lain
        sale.profit,
      ]
    })
    
    // 3. Define Expenses Headers
    const expensesHeaders = ["Tanggal Pengeluaran", "Kategori", "Deskripsi", "Dicatat oleh", "Jumlah"];

    // 4. Map Expenses Data to Rows
    const expensesData = expenses.map((expense) => [
        format(new Date(expense.date), "M/d/yyyy"),
        expense.category,
        expense.description,
        expense.recordedBy?.email || '',
        expense.amount,
    ]);

    // 5. Calculate Footer Totals
    const totalSubTotal = sales.reduce((sum, sale) => sum + sale.subtotal, 0)
    const totalTotalPokok = sales.reduce((sum, sale) => sum + sale.totalCost, 0)
    const totalLabaKotor = totalSubTotal - totalTotalPokok
    const totalDiskon = sales.reduce((sum, sale) => sum + sale.discount, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalLabaJual = totalLabaKotor - totalDiskon - totalExpenses; // Adjusted for expenses

    // 6. Create worksheet data
    let ws_data: (string | number | Date)[][] = [salesHeaders, ...salesData];

    // Add spacing and expense section if there are expenses
    if (expenses.length > 0) {
        ws_data.push([]); // Spacer row
        ws_data.push(["DAFTAR PENGELUARAN:"]);
        ws_data.push(expensesHeaders);
        ws_data.push(...expensesData);
    }
    
    // Add spacing and footer section
    ws_data.push([])
    ws_data.push(["TOTAL KESELURUHAN:"])

    ws_data.push(["", "", "", "", "", "Sub Total :", totalSubTotal])
    ws_data.push(["", "", "", "", "", "Total Pokok :", totalTotalPokok])
    ws_data.push(["", "", "", "", "", "Laba Kotor :", totalLabaKotor])
    ws_data.push(["", "", "", "", "", "Biaya Msk Total :", 0])
    ws_data.push(["", "", "", "", "", "Pot. Faktur :", totalDiskon])
    if (expenses.length > 0) {
      ws_data.push(["", "", "", "", "", "Total Pengeluaran :", totalExpenses]);
    }
    ws_data.push(["", "", "", "", "", "Biaya Lain :", 0])
    ws_data.push(["", "", "", "", "", "Laba Jual (Bersih) :", totalLabaJual])
    
    // 7. Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(ws_data)

    // 8. Set Column Widths
    const colWidths = [
      { wch: 20 }, // No Transaksi
      { wch: 15 }, // Tanggal or Kategori
      { wch: 25 }, // Deskripsi
      { wch: 20 }, // Dicatat oleh
      { wch: 15 }, // Jumlah or Nama Pelanggan
      { wch: 15 }, // Sub Total
      { wch: 15 }, // Total Pokok
      { wch: 15 }, // Laba Kotor
      { wch: 15 }, // Biaya Msk
      { wch: 15 }, // Diskon
      { wch: 15 }, // Biaya Lain
      { wch: 15 }, // Laba Jual
    ]
    ws["!cols"] = colWidths

    // Set number formatting for currency columns
    const currencyFormat = "#,##0.00";
    
    // Format sales data
    const salesDataRows = salesData.length + 1; // +1 for header
    for (let R = 1; R < salesDataRows; ++R) {
        for (let C = 5; C <= 11; ++C) { // Columns F to L
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if(ws[cell_ref] && typeof ws[cell_ref].v === 'number') {
               ws[cell_ref].z = currencyFormat;
            }
        }
    }

    // Format expenses data
    if (expenses.length > 0) {
        const expenseStartRow = salesDataRows + 3; // After sales, spacer, and header
        const expenseEndRow = expenseStartRow + expensesData.length;
        for (let R = expenseStartRow; R < expenseEndRow; ++R) {
            const cell_address = { c: 4, r: R }; // Column E for amount
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if(ws[cell_ref] && typeof ws[cell_ref].v === 'number') {
               ws[cell_ref].z = currencyFormat;
            }
        }
    }
    
    // Format footer totals
    const footerStartRow = ws_data.length - (expenses.length > 0 ? 8 : 7);
    for (let R = footerStartRow; R < ws_data.length; ++R) {
        const cell_address = { c: 6, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if(ws[cell_ref] && typeof ws[cell_ref].v === 'number') {
           ws[cell_ref].z = currencyFormat;
        }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Laba Rugi")
    
    const finalFilename = `${filename || "Laporan_Laba_Rugi_dan_Pengeluaran"}.xlsx`;

    // 9. Trigger Download
    XLSX.writeFile(wb, finalFilename)

    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || (sales.length === 0 && expenses.length === 0)}
          className="w-full sm:w-auto"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Ekspor</DialogTitle>
          <DialogDescription>
            Tinjau detail di bawah dan atur nama file sebelum mengunduh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
            <div className="rounded-md border p-4">
                <p className="font-medium">Data yang akan diekspor</p>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                    <li><span className="font-semibold text-foreground">{sales.length}</span> transaksi penjualan</li>
                    <li><span className="font-semibold text-foreground">{expenses.length}</span> catatan pengeluaran</li>
                </ul>
            </div>
            <div className="space-y-2">
                <Label htmlFor="filename">Nama File</Label>
                <div className="flex items-center">
                    <Input 
                        id="filename" 
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="rounded-r-none focus-visible:ring-offset-0 focus-visible:ring-1"
                    />
                    <span className="inline-flex items-center h-10 px-3 text-sm bg-muted rounded-r-md border border-l-0">.xlsx</span>
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
          <Button onClick={handleExport} disabled={!filename.trim()}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
