"use client"

import type React from "react"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { updateUserAvatarAction } from "@/actions/user"
import { parseError } from "@/lib/error-handler"
import Image from "next/image"

type UpdateAvatarFormProps = {
  onSuccessfulUpload?: () => void
}

export function UpdateAvatarForm({ onSuccessfulUpload }: UpdateAvatarFormProps) {
  const [isPending, startTransition] = useTransition()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("The file is too large. Please choose an image smaller than 5MB.")
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WEBP).")
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const file = formData.get("avatar") as File

    if (!file || file.size === 0) {
      toast.error("Please select an image to upload.")
      return
    }

    startTransition(async () => {
      const result = await updateUserAvatarAction(formData)

      if (result.success) {
        toast.success(result.message || "Profile picture updated successfully!")
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        onSuccessfulUpload?.()
      } else {
        const parsedError = parseError(new Error(result.error))

        if (parsedError.shouldRedirect) {
          toast.error("Your session has expired. Redirecting to login...")
          setTimeout(() => router.push("/login"), 2000)
        } else {
          toast.error(result.error || "Failed to update profile picture.")
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="avatar">Profile Picture</Label>
        <Input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/png, image/jpeg, image/gif, image/webp"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        <p className="text-sm text-gray-500">Upload a JPEG, PNG, GIF, or WEBP image (max 5MB)</p>
      </div>
      {previewUrl && (
        <div className="flex justify-center items-center p-4 border rounded-md bg-gray-50">
          <Image
            src={previewUrl || "/placeholder.svg"}
            alt="Avatar Preview"
            width={128}
            height={128}
            className="rounded-full object-cover h-32 w-32"
          />
        </div>
      )}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <UploadCloud className="mr-2 h-4 w-4" /> Upload Photo
          </>
        )}
      </Button>
    </form>
  )
}
