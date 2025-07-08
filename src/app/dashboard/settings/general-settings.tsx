
"use client"

import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Monitor, Moon, Sun, AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { useDangerZone } from "@/context/danger-zone-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { GlobalSettings } from "@/lib/types"
import { synchronizeCostPrices, updateGlobalSettings } from "./actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const discountFormSchema = z.object({
  defaultDiscount: z.coerce
    .number()
    .min(0, "Diskon tidak boleh negatif.")
    .max(100, "Diskon tidak boleh lebih dari 100."),
})

interface GeneralSettingsProps {
    initialSettings: GlobalSettings;
}

export function GeneralSettings({ initialSettings }: GeneralSettingsProps) {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [mounted, setMounted] = useState(false)
  const { isDangerZoneActive, activateDangerZone, deactivateDangerZone } = useDangerZone()
  const [password, setPassword] = useState("")

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncAlertOpen, setIsSyncAlertOpen] = useState(false);

  useEffect(() => {
    setMounted(true)
  }, [])

  const discountForm = useForm<z.infer<typeof discountFormSchema>>({
    resolver: zodResolver(discountFormSchema),
    values: {
      defaultDiscount: initialSettings.defaultDiscount || 0,
    },
  })

  useEffect(() => {
    discountForm.reset({ defaultDiscount: initialSettings.defaultDiscount || 0 })
  }, [initialSettings, discountForm])

  async function onDiscountSubmit(values: z.infer<typeof discountFormSchema>) {
    const result = await updateGlobalSettings(values);
    if (result.success) {
      toast({
        title: "Pengaturan Disimpan",
        description: `Diskon default telah diatur ke ${values.defaultDiscount}%.`,
      })
    } else {
       toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: result.message,
      })
    }
  }
  
  async function handleSync() {
    setIsSyncing(true);
    const result = await synchronizeCostPrices();
    if (result.success) {
        toast({
            title: "Sinkronisasi Berhasil",
            description: result.message,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Sinkronisasi Gagal",
            description: result.message,
        });
    }
    setIsSyncing(false);
    setIsSyncAlertOpen(false);
  }

  const handleActivation = () => {
    const success = activateDangerZone(password)
    if (success) {
      setPassword("")
    }
  }

  const { isSubmitting } = discountForm.formState;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>
            Sesuaikan tampilan aplikasi agar sesuai dengan preferensi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-[98px] w-full" />
              <Skeleton className="h-[98px] w-full" />
              <Skeleton className="h-[98px] w-full" />
            </div>
          ) : (
            <RadioGroup
              value={theme}
              onValueChange={setTheme}
              className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <div>
                  <Label className="cursor-pointer">
                    <RadioGroupItem value="light" className="sr-only" />
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:border-primary data-[state=checked]:border-primary">
                        <Sun className="h-6 w-6 mb-2" />
                        Terang
                    </div>
                  </Label>
                </div>
                 <div>
                  <Label className="cursor-pointer">
                    <RadioGroupItem value="dark" className="sr-only" />
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:border-primary data-[state=checked]:border-primary">
                        <Moon className="h-6 w-6 mb-2" />
                        Gelap
                    </div>
                  </Label>
                </div>
                 <div>
                  <Label className="cursor-pointer">
                    <RadioGroupItem value="system" className="sr-only" />
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:border-primary data-[state=checked]:border-primary">
                        <Monitor className="h-6 w-6 mb-2" />
                        Sistem
                    </div>
                  </Label>
                </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaksi</CardTitle>
          <CardDescription>
            Atur nilai default untuk transaksi penjualan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...discountForm}>
            <form onSubmit={discountForm.handleSubmit(onDiscountSubmit)} className="space-y-6">
              <FormField
                control={discountForm.control}
                name="defaultDiscount"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Diskon Default (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Diskon ini akan otomatis diterapkan pada setiap transaksi baru.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Diskon
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>
            Anda saat ini login sebagai pengguna berikut.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4 max-w-sm">
             <div>
                <Label>Email Pengguna</Label>
                <p className="text-sm font-medium text-muted-foreground">{user?.email || 'Memuat...'}</p>
             </div>
              <div>
                <Label>Peran</Label>
                {user?.role && (
                   <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                     {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                   </Badge>
                )}
             </div>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sinkronisasi Data (Tindakan Berisiko)</CardTitle>
            <CardDescription>
                Perbaiki data historis dengan menimpa harga modal di semua riwayat transaksi.
                <span className="font-bold text-destructive"> Gunakan dengan sangat hati-hati:</span> Fitur ini ideal untuk memperbaiki kesalahan data awal, bukan untuk pembaruan harga rutin.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <AlertDialog open={isSyncAlertOpen} onOpenChange={setIsSyncAlertOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sinkronkan Harga Modal
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin ingin menimpa data historis?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini <span className="font-bold">tidak dapat dibatalkan</span>.
                          Sistem akan mengambil harga modal <span className="font-bold">saat ini</span> dari setiap produk dan menerapkannya ke <span className="font-bold">semua transaksi penjualan sebelumnya</span>.
                          Jika harga modal saat ini lebih tinggi dari harga jual di masa lalu, laba historis Anda akan menjadi <span className="font-bold text-destructive">negatif</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSyncing}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSync} disabled={isSyncing}>
                            {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSyncing ? "Menyinkronkan..." : "Ya, Saya Mengerti Risikonya"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Zona Bahaya</CardTitle>
          <CardDescription>
            Aktifkan mode ini untuk mengakses fitur penghapusan data sensitif.
            Tindakan ini tidak dapat diurungkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDangerZoneActive ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Mode Berbahaya Aktif</AlertTitle>
                <AlertDescription>
                  Fitur penghapusan riwayat penjualan dan pengeluaran saat ini
                  diaktifkan. Harap berhati-hati.
                </AlertDescription>
              </Alert>
              <Button
                onClick={deactivateDangerZone}
                variant="outline"
              >
                Nonaktifkan Zona Bahaya
              </Button>
            </div>
          ) : (
            <div className="max-w-sm space-y-2">
              <Label htmlFor="danger-password">Kata Sandi Admin</Label>
              <div className="flex gap-2">
                <Input
                  id="danger-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleActivation()}
                />
                <Button onClick={handleActivation} variant="destructive">
                  Aktifkan
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Masukkan kata sandi untuk mengaktifkan penghapusan data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
