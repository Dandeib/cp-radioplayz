'use client'

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema } from "@/lib/zod"
import { signIn } from "next-auth/react"
import { redirect } from "next/navigation"

export default function Page() {

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    const response = await signIn("credentials", { username: values.username, password: values.password, redirect: false })
    if(response?.error) return form.setError("password", { message: 'Dein Username oder Passwort ist falsch' })
    redirect("/dashboard")
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-[400px] rounded-lg shadow-lg p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormDescription>
                    Gib dein Username ein.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="passwort" {...field} />
                  </FormControl>
                  <FormDescription>
                    Gib dein Passwort ein.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </div>
    </div>
  )

}