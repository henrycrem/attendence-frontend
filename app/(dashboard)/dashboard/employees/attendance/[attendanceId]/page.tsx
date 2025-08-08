import AttendanceDetailsComponent from '@/components/attendance-details'

export const dynamic = "force-dynamic"

interface AttendanceDetailsPageProps {
  params: {
    attendanceId: string
  }
}

export default function AttendanceDetailsPage({ params }: AttendanceDetailsPageProps) {
  return <AttendanceDetailsComponent attendanceId={params.attendanceId} />
}
