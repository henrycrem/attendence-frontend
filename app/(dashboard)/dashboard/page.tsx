import AttendanceStats from '@/components/admin/attendance-stats'
import AttendanceTable from '@/components/admin/attendance-table'
import DailyAttendanceChart from '@/components/admin/daily-attendance-chart'
import { getCurrentUserAction } from '@/actions/auth'
import { redirect } from 'next/navigation'


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
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage employee attendance</p>
        </div>
        
        <AttendanceStats />
        <DailyAttendanceChart />
        <AttendanceTable />
      </div>
    </div>
  )
}
