
"use client";

import { useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Pencil, Loader2, ChevronDown } from "lucide-react";
import type { ExpenseCategoryDoc } from "@/lib/types";
import { CategoryFormDialog } from "./category-form-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { deleteExpenseCategory, updateExpenseCategory } from "./actions";
import { Input } from "@/components/ui/input";

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
  
  const [newDescriptions, setNewDescriptions] = useState<Record<string, string>>({});
  const [isUpdatingDesc, setIsUpdatingDesc] = useState<Record<string, boolean>>({});

  const handleDescriptionChange = (categoryId: string, value: string) => {
    setNewDescriptions(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleAddDescription = async (category: ExpenseCategoryDoc) => {
    const newDescription = newDescriptions[category.id]?.trim();
    if (!newDescription) return;

    setIsUpdatingDesc(prev => ({ ...prev, [category.id]: true }));
    const updatedDescriptions = [...(category.descriptions || []), newDescription];
    const result = await updateExpenseCategory(category.id, { descriptions: updatedDescriptions });
    
    if (result.success) {
      toast({ title: "Sukses", description: "Deskripsi default ditambahkan." });
      handleDescriptionChange(category.id, '');
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsUpdatingDesc(prev => ({ ...prev, [category.id]: false }));
  };

  const handleDeleteDescription = async (category: ExpenseCategoryDoc, descriptionToDelete: string) => {
    setIsUpdatingDesc(prev => ({ ...prev, [category.id]: true }));
    const updatedDescriptions = (category.descriptions || []).filter(d => d !== descriptionToDelete);
    const result = await updateExpenseCategory(category.id, { descriptions: updatedDescriptions });
    
    if (result.success) {
      toast({ title: "Sukses", description: "Deskripsi default dihapus." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
    setIsUpdatingDesc(prev => ({ ...prev, [category.id]: false }));
  };

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
          <CardTitle>Kategori & Deskripsi Pengeluaran</CardTitle>
          <CardDescription>
            Atur kategori dan deskripsi default untuk mempercepat pencatatan.
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
        {initialCategories.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {initialCategories.map((category) => (
              <AccordionItem value={category.id} key={category.id}>
                <AccordionPrimitive.Header className="flex w-full items-center">
                  <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-4 pr-2 font-medium transition-all hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    {category.name}
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                  <div className="pl-2 pr-4 space-x-1">
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
                </AccordionPrimitive.Header>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">Deskripsi default untuk kategori ini:</p>
                    {category.descriptions && category.descriptions.length > 0 ? (
                      <ul className="space-y-2">
                        {category.descriptions.map((desc, index) => (
                          <li key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                            <span>{desc}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDescription(category, desc)} disabled={isUpdatingDesc[category.id]}>
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-2">Belum ada deskripsi default.</p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tambah deskripsi baru..."
                        value={newDescriptions[category.id] || ''}
                        onChange={(e) => handleDescriptionChange(category.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDescription(category)}
                      />
                      <Button onClick={() => handleAddDescription(category)} disabled={!newDescriptions[category.id] || isUpdatingDesc[category.id]}>
                        {isUpdatingDesc[category.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : "Tambah"}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            Belum ada kategori.
          </div>
        )}
        
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
