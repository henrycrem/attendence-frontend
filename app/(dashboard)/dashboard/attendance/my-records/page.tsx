// app/employee/page.tsx
import AttendanceSummaryCard from '@/components/employee/attendance-summary-card'
import AttendanceHistoryServer from '@/components/employee/AttendanceHistoryServer'
import { getCurrentUserAction } from '@/actions/auth'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function EmployeeAttendancePage({
  searchParams,
}: {
  searchParams: { page?: string; month?: string; year?: string }
}) {
  let user = null
  
  try {
    user = await getCurrentUserAction()
  } catch (error) {
    console.error("User not authenticated:", error)
    redirect("/")
  }

  if (!user || user.role?.roleName !== 'employee') {
    redirect("/unauthorized")
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Attendance Records</h1>
          <p className="text-gray-600">Track your attendance and work hours</p>
        </div>
        
        <AttendanceSummaryCard />
        <AttendanceHistoryServer searchParams={searchParams} />
      </div>
    </div>
  )
}