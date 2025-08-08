// components/employee/AttendanceHistoryServer.tsx
import AttendanceHistoryClient from './attendance-history-table';
import { getEmployeeAttendanceHistory } from '@/actions/dashboard'; 

export default async function AttendanceHistoryServer({
  searchParams,
}: {
  searchParams: { page?: string; month?: string; year?: string }
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1
  const month = searchParams.month || ''
  const year = searchParams.year || ''

  let initialData = null
  let error = null

  try {
    const result = await getEmployeeAttendanceHistory({ page, month, year })
    initialData = result.data
  } catch (err: any) {
    console.error("Server Component Error (History):", err.message)
    error = err.message
  }

  return <AttendanceHistoryClient initialData={initialData} initialError={error} />
}