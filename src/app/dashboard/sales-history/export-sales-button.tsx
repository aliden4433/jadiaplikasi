
"use client"

import * as XLSX from "xlsx"
import { FileDown } from "lucide-react"
import { format } from "date-fns"

import type { Sale } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface ExportSalesButtonProps {
  sales: Sale[]
  disabled?: boolean
}

export function ExportSalesButton({ sales, disabled }: ExportSalesButtonProps) {
  const handleExport = () => {
    // 1. Define Headers
    const headers = [
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
    const data = sales.map((sale) => {
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

    // 3. Calculate Footer Totals
    const totalSubTotal = sales.reduce((sum, sale) => sum + sale.subtotal, 0)
    const totalTotalPokok = sales.reduce((sum, sale) => sum + sale.totalCost, 0)
    const totalLabaKotor = totalSubTotal - totalTotalPokok
    const totalDiskon = sales.reduce((sum, sale) => sum + sale.discount, 0)
    const totalLabaJual = totalLabaKotor - totalDiskon

    // 4. Create worksheet data (headers + data rows + empty rows + footer)
    const ws_data: (string | number | Date)[][] = [headers, ...data]

    // Add empty rows for spacing before the footer
    ws_data.push([])
    ws_data.push(["TOTAL KESELURUHAN:"])

    // Add footer rows, aligning values to the right
    ws_data.push(["", "", "", "", "", "Sub Total :", totalSubTotal])
    ws_data.push(["", "", "", "", "", "Total Pokok :", totalTotalPokok])
    ws_data.push(["", "", "", "", "", "Laba Kotor :", totalLabaKotor])
    ws_data.push(["", "", "", "", "", "Biaya Msk Total :", 0])
    ws_data.push(["", "", "", "", "", "Pot. Faktur :", totalDiskon])
    ws_data.push(["", "", "", "", "", "Biaya Lain :", 0])
    ws_data.push(["", "", "", "", "", "Laba Jual :", totalLabaJual])
    
    // 5. Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(ws_data)

    // 6. Set Column Widths
    const colWidths = [
      { wch: 20 }, // No Transaksi
      { wch: 12 }, // Tanggal
      { wch: 8 },  // Dept.
      { wch: 10 }, // Kode Pel.
      { wch: 15 }, // Nama Pelanggan
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
    const currencyFormat = "#,##0.00"
    const dataRows = data.length + 1 // +1 because headers are row 1
    
    for (let R = 1; R < dataRows; ++R) {
        for (let C = 5; C <= 11; ++C) { // Columns F to L
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if(ws[cell_ref] && typeof ws[cell_ref].v === 'number') {
               ws[cell_ref].z = currencyFormat;
            }
        }
    }
    // Format footer totals
    for (let R = dataRows + 2; R <= dataRows + 8; ++R) {
        const cell_address = { c: 6, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if(ws[cell_ref] && typeof ws[cell_ref].v === 'number') {
           ws[cell_ref].z = currencyFormat;
        }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Laba Rugi")

    // 7. Trigger Download
    XLSX.writeFile(wb, "Laporan_Laba_Rugi.xlsx")
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || sales.length === 0}
      className="w-full sm:w-auto"
    >
      <FileDown className="mr-2 h-4 w-4" />
      Export Excel
    </Button>
  )
}
