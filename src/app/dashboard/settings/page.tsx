
"use client"

import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Monitor, Moon, Sun } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const discountFormSchema = z.object({
  discount: z.coerce
    .number()
    .min(0, "Diskon tidak boleh negatif.")
    .max(100, "Diskon tidak boleh lebih dari 100."),
})

const profileFormSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong."),
  role: z.enum(["admin", "kasir"]),
})

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  
  const [defaultDiscount, setDefaultDiscount] = useState(0);

  useEffect(() => {
    const savedDiscount = localStorage.getItem("defaultDiscount");
    if (savedDiscount) {
      const parsedDiscount = parseFloat(savedDiscount);
      if (!isNaN(parsedDiscount)) {
        setDefaultDiscount(parsedDiscount);
      }
    }
  }, []);

  const discountForm = useForm<z.infer<typeof discountFormSchema>>({
    resolver: zodResolver(discountFormSchema),
    values: {
      discount: defaultDiscount,
    },
  })
  
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "Jane Doe",
      role: "admin",
    },
  })

  useEffect(() => {
    discountForm.reset({ discount: defaultDiscount });
  }, [defaultDiscount, discountForm]);

  function onDiscountSubmit(values: z.infer<typeof discountFormSchema>) {
    localStorage.setItem("defaultDiscount", values.discount.toString());
    setDefaultDiscount(values.discount);
    toast({
      title: "Pengaturan Disimpan",
      description: `Diskon default telah diatur ke ${values.discount}%.`,
    })
  }
  
  function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    // This is a placeholder for now
    toast({
      title: "Fitur Belum Tersedia",
      description: "Kemampuan untuk mengubah profil akan segera hadir.",
    })
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>
            Sesuaikan tampilan aplikasi agar sesuai dengan preferensi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                name="discount"
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
              <Button type="submit">Simpan Diskon</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>
            Kelola informasi profil Anda. Pengelolaan peran akan tersedia di pembaruan mendatang.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="space-y-4">
                 <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Nama Pengguna</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Peran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih peran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="kasir">Kasir</SelectItem>
                        </SelectContent>
                      </Select>
                       <FormDescription>
                        Peran pengguna saat ini. Hubungi admin untuk mengubah.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled>Simpan Profil</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
