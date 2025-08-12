"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getDepartmentByIdAction, updateDepartmentAction } from "@/actions/department"
import type { Department } from "@/types/department"

const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Department Name must be at least 2 characters.",
    })
    .max(50, {
      message: "Department Name must not be longer than 50 characters.",
    }),
  description: z
    .string()
    .max(200, {
      message: "Description must not be longer than 200 characters.",
    })
    .optional(),
})

type EditDepartmentFormProps = {
  departmentId: string
}

export function EditDepartmentForm({ departmentId }: EditDepartmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingDepartment, setLoadingDepartment] = useState(true)
  const [departmentData, setDepartmentData] = useState<Department | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    async function fetchDepartment() {
      setLoadingDepartment(true)
      setError(null)
      const result = await getDepartmentByIdAction(departmentId)
      if (result.success && result.data) {
        setDepartmentData(result.data)
        form.reset({
          name: result.data.name,
          description: result.data.description || "",
        })
      } else {
        setError(result.error || "Failed to load department data.")
        toast.error(result.error || "Failed to load department data.")
      }
      setLoadingDepartment(false)
    }
    fetchDepartment()
  }, [departmentId, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("name", values.name)
      if (values.description) {
        formData.append("description", values.description)
      } else {
        formData.append("description", "") // Send empty string if description is cleared
      }

      const result = await updateDepartmentAction(departmentId, formData)

      if (result.success) {
        toast.success(result.message || "Department updated successfully!")
        router.push("/dashboard/departments") // Redirect to departments list
      } else {
        toast.error(result.error || "Failed to update department.")
      }
    })
  }

  if (loadingDepartment) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading department data...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </CardContent>
      </Card>
    )
  }

  if (!departmentData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">Department not found.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Edit Department: {departmentData.name}</CardTitle>
        <CardDescription>Update the details for this department.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Human Resources" {...field} />
                  </FormControl>
                  <FormDescription>This is the unique name for the department.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the department's function" {...field} />
                  </FormControl>
                  <FormDescription>Optional: Provide a brief description of this department.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Department"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
