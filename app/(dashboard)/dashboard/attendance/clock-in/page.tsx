import SimpleAttendanceClock from "@/components/clock-in"
import { getCurrentUserAction } from "@/actions/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AttendanceClockPage() {
  let user = null
  
  try {
    user = await getCurrentUserAction()
  } catch (error) {
    console.error("User not authenticated:", error)
    redirect("/")
  }

  if (!user) {
    redirect("/")
  }

  return (
    <SimpleAttendanceClock 
      userId={user.id}
      userName={user.name}
      userEmail={user.email}
    />
  )
}
