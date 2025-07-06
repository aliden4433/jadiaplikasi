"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Pencil, Loader2 } from "lucide-react";
import type { ExpenseCategoryDoc } from "@/lib/types";
import { CategoryFormDialog } from "./category-form-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteExpenseCategory } from "./actions";

interface CategorySettingsProps {
  initialCategories: ExpenseCategoryDoc[];
}

export function CategorySettingsClient({ initialCategories }: CategorySettingsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryDoc | undefined>(undefined);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategoryDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleOpenForm = (category?: ExpenseCategoryDoc) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleOpenDeleteAlert = (category: ExpenseCategoryDoc) => {
    setCategoryToDelete(category);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteExpenseCategory(categoryToDelete.id);
      if (result.success) {
        toast({ title: "Sukses", description: result.message });
        setIsDeleteAlertOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus kategori.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Kategori Pengeluaran</CardTitle>
          <CardDescription>
            Atur kategori untuk pencatatan pengeluaran Anda.
          </CardDescription>
        </div>
        <CategoryFormDialog
          open={isFormOpen && !selectedCategory}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedCategory(undefined);
            setIsFormOpen(isOpen);
          }}
          category={undefined}
        >
          <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2" />
            Tambah Kategori
          </Button>
        </CategoryFormDialog>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul role="list" className="divide-y divide-border">
            {initialCategories.map((category) => (
              <li key={category.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium">{category.name}</span>
                <div className="space-x-2">
                  <CategoryFormDialog
                    open={isFormOpen && selectedCategory?.id === category.id}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedCategory(undefined);
                        setIsFormOpen(isOpen);
                    }}
                    category={category}
                  >
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm(category)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {category.name}</span>
                    </Button>
                  </CategoryFormDialog>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteAlert(category)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Hapus {category.name}</span>
                  </Button>
                </div>
              </li>
            ))}
             {initialCategories.length === 0 && (
                <li className="text-center text-sm text-muted-foreground py-4">
                    Belum ada kategori.
                </li>
            )}
          </ul>
        </div>
        
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Menghapus kategori ini tidak akan menghapus data pengeluaran yang sudah ada.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
