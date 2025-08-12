"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createEmployeeAction } from "@/actions/employee"
import { employeeCreationSchema } from "@/lib/zod-schemas"

type UserOption = {
  id: string
  name: string
  email: string
  departmentName: string | null
}

type Department = {
  id: string
  name: string
}

interface EmployeeFormProps {
  users: UserOption[]
  // departments: Department[]
}

export default function EmployeeForm({ users }: EmployeeFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof employeeCreationSchema>>({
    resolver: zodResolver(employeeCreationSchema),
    defaultValues: {
      userId: "",
      hireDate: null,
      salary: null,
   
    },
  })

  const onSubmit = (values: z.infer<typeof employeeCreationSchema>) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString())
          } else {
            formData.append(key, String(value))
          }
        }
      })

      const result = await createEmployeeAction(null, formData)

      if (result.status === "success") {
        toast.success(result.message)
        router.push("/dashboard/employees")
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Employee Record</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
           <FormField
  control={form.control}
  name="userId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>User</FormLabel>
      <Select onValueChange={field.onChange} value={field.value} disabled={!users.length}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {users.length === 0 ? (
            <SelectItem value="no-users" disabled>
              No users available
            </SelectItem>
          ) : (
            users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.email}) - {user.departmentName || "No Department"}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {!users.length && (
        <p className="text-sm text-muted-foreground">No users found. Please try again later.</p>
      )}
      <FormMessage />
    </FormItem>
  )}
/>
            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Hire Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="50000.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Employee Record
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}