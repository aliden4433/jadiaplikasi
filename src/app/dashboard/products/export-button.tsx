"use client"

import jsPDF from "jspdf"
import "jspdf-autotable"
import { FileDown } from "lucide-react"

import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function ExportButton({ products }: { products: Product[] }) {
  const handleExport = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    doc.text("Daftar Produk", 14, 16);
    
    const tableColumn = ["Nama", "Deskripsi", "Harga Jual", "Harga Modal", "Stok"];
    const tableRows: (string|number)[][] = [];

    products.forEach(product => {
      const productData = [
        product.name,
        product.description,
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.price),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.costPrice),
        product.stock,
      ];
      tableRows.push(productData);
    });

    doc.autoTable({
      startY: 20,
      head: [tableColumn],
      body: tableRows,
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save("daftar-produk.pdf");
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={products.length === 0}>
      <FileDown className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
