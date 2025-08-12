"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createRoleAction } from "@/actions/role"

const formSchema = z.object({
  displayName: z
    .string()
    .min(2, {
      message: "Display Name must be at least 2 characters.",
    })
    .max(50, {
      message: "Display Name must not be longer than 50 characters.",
    }),
  roleName: z
    .string()
    .min(2, {
      message: "Role Name must be at least 2 characters.",
    })
    .max(50, {
      message: "Role Name must not be longer than 50 characters.",
    })
    .regex(/^[a-z0-9_]+$/, {
      message: "Role Name can only contain lowercase letters, numbers, and underscores.",
    }),
  description: z
    .string()
    .max(200, {
      message: "Description must not be longer than 200 characters.",
    })
    .optional(),
})

export function CreateRoleForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      roleName: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("displayName", values.displayName)
      formData.append("roleName", values.roleName)
      if (values.description) {
        formData.append("description", values.description)
      }

      const result = await createRoleAction(formData)

      if (result.success) {
        toast.success(result.message || "Role created successfully!")
        form.reset()
        router.push("/dashboard/users-role") // Redirect to roles list
      } else {
        toast.error(result.error || "Failed to create role.")
      }
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Role</CardTitle>
        <CardDescription>
          Define a new role with a display name, unique role name, and an optional description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Human Resources Manager" {...field} />
                  </FormControl>
                  <FormDescription>This is the name that will be visible in the UI.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., hr_manager" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique, lowercase identifier for the role (e.g., `super_admin`, `employee`).
                  </FormDescription>
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
                    <Textarea placeholder="Brief description of the role's responsibilities" {...field} />
                  </FormControl>
                  <FormDescription>Optional: Provide a brief description of this role.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
