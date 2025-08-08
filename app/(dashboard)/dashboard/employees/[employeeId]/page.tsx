import EmployeeAttendance from '@/components/employee-attendance'

export const dynamic = "force-dynamic"

interface EmployeePageProps {
  params: Promise<{
    employeeId: string
  }>
}

export default async function EmployeePage({ params }: EmployeePageProps) {
  // ✅ Await params in Next.js 15
  const { employeeId } = await params
  return <EmployeeAttendance employeeId={employeeId} />
}
