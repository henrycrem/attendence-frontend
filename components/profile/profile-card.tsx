"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Mail, Briefcase, Building2, Calendar, KeyRound, ImageIcon, User2 } from "lucide-react"
import type { User } from "@/types/user"
import { UpdateAvatarForm } from "./update-avatar-form"
import { ResetPasswordForm } from "./reset-password-form"
import { useState } from "react"

type ProfileCardProps = {
  user: User
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not available"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getAvatarUrl = (avatarPath: string | null | undefined) => {
    if (!avatarPath) return "/user-profile-avatar.png"

    // If avatar path starts with http, it's already a full URL
    if (avatarPath.startsWith("http")) return avatarPath

    // Otherwise, prepend the backend server URL
    const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"
    return `${backendUrl}${avatarPath}`
  }

  const profileItems = [
    {
      icon: Mail,
      label: "Email Address",
      value: user.email
    },
    {
      icon: Briefcase,
      label: "Position",
      value: user.position || "Not specified"
    },
    {
      icon: Building2,
      label: "Department",
      value: user.department?.name || "Not assigned"
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: formatDate(user.createdAt)
    },
    {
      icon: User2,
      label: "Last Login",
      value: formatDate(user.lastLogin)
    }
  ]

  return (
    <Card className="w-full bg-white shadow-lg border-0">
      {/* Header Section */}
      <CardHeader className="bg-red-600 text-white p-8 rounded-t-lg">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-md">
            <AvatarImage src={getAvatarUrl(user.avatar) || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-2xl font-bold bg-red-700 text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-bold mb-2">
            {user.name}
          </CardTitle>
          <CardDescription className="text-red-100 text-base">
            {user.role?.displayName || "Team Member"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {/* Profile Information */}
        <div className="mb-8 space-y-6">
          {/* First Row: Email and Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileItems.slice(0, 2).map((item, index) => {
              const IconComponent = item.icon
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {item.label}
                    </p>
                    <p className="text-gray-900 font-medium truncate" title={item.value}>
                      {item.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Second Row: Department and Member Since */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileItems.slice(2, 4).map((item, index) => {
              const IconComponent = item.icon
              return (
                <div key={index + 2} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {item.label}
                    </p>
                    <p className="text-gray-900 font-medium truncate" title={item.value}>
                      {item.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Third Row: Last Login (centered, full width) */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {(() => {
                const item = profileItems[4]
                const IconComponent = item.icon
                return (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {item.label}
                      </p>
                      <p className="text-gray-900 font-medium truncate" title={item.value}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-11 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                >
                  <ImageIcon className="mr-2 h-4 w-4" /> 
                  Change Photo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Update Profile Photo</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Upload a new image for your profile picture.
                  </DialogDescription>
                </DialogHeader>
                <UpdateAvatarForm onSuccessfulUpload={() => setIsAvatarDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-11 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                >
                  <KeyRound className="mr-2 h-4 w-4" /> 
                  Reset Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Reset Password</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Enter your current and new password to reset it.
                  </DialogDescription>
                </DialogHeader>
                <ResetPasswordForm onSuccessfulReset={() => setIsPasswordDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}