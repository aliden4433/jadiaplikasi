
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PlusCircle, Wallet, ChevronLeft, ChevronRight, ReceiptText, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import type { Expense, ExpenseCategoryDoc, AppUser } from "@/lib/types";
import { getColumns } from "./columns";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ExpensesDataTableToolbar } from "./expenses-data-table-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ExpenseRowActions } from "./expense-row-actions";


interface ExpensesClientPageProps {
  initialExpenses: Expense[];
  initialCategories: ExpenseCategoryDoc[];
}

// Mobile Card Component specific for Expenses
const ExpenseMobileCard = ({ row, userRole, categories = [] }: { row: any, userRole?: AppUser['role'], categories?: ExpenseCategoryDoc[] }) => {
    const expense = row.original as Expense
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

    return (
        <>
            {userRole === 'admin' && (
                <ExpenseFormDialog
                    expense={expense}
                    categories={categories}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            )}
            <Card key={row.id} data-state={row.getIsSelected() && "selected"} className="bg-card">
                <CardContent className="p-4 flex gap-4 items-start">
                    {userRole === 'admin' && (
                        <div className="pt-1">
                            <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(value) => row.toggleSelected(!!value)}
                                aria-label="Select row"
                            />
                        </div>
                    )}
                    <div className="flex-grow space-y-2 overflow-hidden">
                        <div className="flex justify-between items-start">
                             <button
                                onClick={() => userRole === 'admin' && setIsEditDialogOpen(true)}
                                disabled={userRole !== 'admin'}
                                className="font-semibold pr-2 break-words text-left hover:underline disabled:no-underline disabled:cursor-text"
                            >
                                {expense.description}
                            </button>
                            {userRole === 'admin' && (
                                <div className="-mt-2 -mr-2 flex-shrink-0">
                                <ExpenseRowActions expense={expense} categories={categories} />
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span>Tanggal</span>
                                <span className="font-medium text-foreground">{format(new Date(expense.date), "d MMM yyyy", { locale: id })}</span>
                            </div>
                             <div className="flex justify-between">
                                <span>Kategori</span>
                                <Badge variant="outline">{expense.category}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Jumlah</span>
                                <span className="font-medium text-foreground">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(expense.amount)}</span>
                            </div>
                             {expense.recordedBy && (
                                <div className="flex justify-between">
                                    <span>Dicatat oleh</span>
                                    <span className="font-medium text-foreground truncate">{expense.recordedBy.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

// DataTable Component specific for Expenses
interface ExpenseDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  userRole?: AppUser['role']
  categories?: ExpenseCategoryDoc[]
}

function ExpenseDataTable<TData, TValue>({
  columns,
  data,
  userRole,
  categories = [],
}: ExpenseDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const isMobile = useIsMobile()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        <ExpensesDataTableToolbar
            table={table}
            userRole={userRole}
            filterColumnId="description"
            filterPlaceholder="Filter berdasarkan deskripsi..."
        />
        <div className="space-y-4 pb-4">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => <ExpenseMobileCard key={row.id} row={row} userRole={userRole} categories={categories} />)
            ) : (
              <Card>
                <CardContent className="h-24 flex items-center justify-center text-muted-foreground">
                  Tidak ada hasil.
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    )
  }

  // Desktop table view
  return (
    <div className="space-y-4">
      <ExpensesDataTableToolbar
        table={table}
        userRole={userRole}
        filterColumnId="description"
        filterPlaceholder="Filter berdasarkan deskripsi..."
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada hasil.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


export function ExpensesClientPage({ initialExpenses, initialCategories }: ExpensesClientPageProps) {
  const { user } = useAuth();
  const userRole = user?.role;
  const columns = React.useMemo(() => getColumns(initialCategories), [initialCategories]);
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      if (!prev) return undefined;
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (!prev) return undefined;
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const { monthlyTotal, displayedMonthName, filteredExpenses, expenseCount, averageExpense } = useMemo(() => {
    if (!currentDate) {
        return { monthlyTotal: 0, displayedMonthName: 'Memuat...', filteredExpenses: [], expenseCount: 0, averageExpense: 0 };
    }

    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();
    const displayedMonthName = format(currentDate, "MMMM yyyy", { locale: id });

    const filtered = initialExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
      });

    const total = filtered.reduce((acc, expense) => acc + expense.amount, 0);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;

    return { monthlyTotal: total, displayedMonthName, filteredExpenses: filtered, expenseCount: count, averageExpense: avg };
  }, [initialExpenses, currentDate]);

  const isNextMonthDisabled = useMemo(() => {
    if (!currentDate) return true;

    const nextMonth = new Date(currentDate);
    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const today = new Date();
    today.setDate(1);
    today.setHours(0,0,0,0);
    return nextMonth > today;
  }, [currentDate]);

  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
         <div className="flex items-center justify-center text-sm text-muted-foreground pt-1 gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Bulan sebelumnya</span>
            </Button>
            <span className="font-medium text-lg text-foreground w-36 text-center">{displayedMonthName}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth} disabled={isNextMonthDisabled}>
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Bulan berikutnya</span>
            </Button>
        </div>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
             <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(monthlyTotal)}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {expenseCount}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rata-Rata Pengeluaran</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                     {formatCurrency(averageExpense)}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>

      <div className="flex justify-end">
        {!isMobile && (
            <ExpenseFormDialog categories={initialCategories}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Pengeluaran
            </Button>
            </ExpenseFormDialog>
        )}
      </div>
      <ExpenseDataTable
        columns={columns}
        data={filteredExpenses}
        userRole={userRole}
        categories={initialCategories}
      />
       {isMobile && (
         <ExpenseFormDialog categories={initialCategories}>
            <Button
                className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20"
                size="icon"
            >
                <PlusCircle className="h-7 w-7" />
                <span className="sr-only">Tambah Pengeluaran</span>
            </Button>
        </ExpenseFormDialog>
      )}
    </div>
  );
}
