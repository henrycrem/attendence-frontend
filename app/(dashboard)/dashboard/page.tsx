import AttendanceStats from '@/components/admin/attendance-stats'
import AttendanceTable from '@/components/admin/attendance-table'
import DailyAttendanceChart from '@/components/admin/daily-attendance-chart'
import { getCurrentUserAction } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { BarChart3, Users } from 'lucide-react'

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  let user = null
  
  try {
    user = await getCurrentUserAction()
  } catch (error) {
    console.error("User not authenticated:", error)
    redirect("/")
  }

  if (!user || user.role?.roleName !== 'super_admin') {
    redirect("/unauthorized")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section with Red Theme */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">Monitor and manage employee attendance</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div className="space-y-6">
            <AttendanceStats />
            <DailyAttendanceChart />
            <AttendanceTable />
          </div>
        </div>
      </div>
    </div>
  )
}