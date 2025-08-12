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
import { getRoleByIdAction, updateRoleAction } from "@/actions/role"
import type { Role } from "@/types/role"

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

type EditRoleFormProps = {
  roleId: string
}

export function EditRoleForm({ roleId }: EditRoleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingRole, setLoadingRole] = useState(true)
  const [roleData, setRoleData] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      roleName: "",
      description: "",
    },
  })

  useEffect(() => {
    async function fetchRole() {
      setLoadingRole(true)
      setError(null)
      const result = await getRoleByIdAction(roleId)
      if (result.success && result.data) {
        setRoleData(result.data)
        form.reset({
          displayName: result.data.displayName,
          roleName: result.data.roleName,
          description: result.data.description || "",
        })
      } else {
        setError(result.error || "Failed to load role data.")
        toast.error(result.error || "Failed to load role data.")
      }
      setLoadingRole(false)
    }
    fetchRole()
  }, [roleId, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("displayName", values.displayName)
      formData.append("roleName", values.roleName)
      if (values.description) {
        formData.append("description", values.description)
      } else {
        formData.append("description", "") // Send empty string if description is cleared
      }

      const result = await updateRoleAction(roleId, formData)

      if (result.success) {
        toast.success(result.message || "Role updated successfully!")
        router.push("/dashboard/roles") // Redirect to roles list
      } else {
        toast.error(result.error || "Failed to update role.")
      }
    })
  }

  if (loadingRole) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading role data...</p>
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

  if (!roleData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">Role not found.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Edit Role: {roleData.displayName}</CardTitle>
        <CardDescription>Update the details for this role.</CardDescription>
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
                    <Input placeholder="e.g., hr_manager" {...field} disabled={roleData.roleName === "super_admin"} />
                  </FormControl>
                  <FormDescription>
                    A unique, lowercase identifier for the role (e.g., `super_admin`, `employee`). Cannot be changed for
                    `super_admin`.
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
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
