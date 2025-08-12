import { getCurrentUserActionProfile } from "@/actions/user"
import { ProfileCard } from "@/components/profile/profile-card"
import { Card, CardContent } from "@/components/ui/card"
import { UserIcon } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MyProfilePage() {
  const result = await getCurrentUserActionProfile()

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen p-6">
          <Card className="max-w-md mx-auto shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">{result.error || "Failed to load user profile."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const user = result.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600">Manage your personal information and account settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="max-w-4xl mx-auto">
          <ProfileCard user={user} />
        </div>
      </div>
    </div>
  )
}