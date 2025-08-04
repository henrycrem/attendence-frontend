import Link from 'next/link'
import React from 'react'

const AttendencePage = () => {
  return (
    <div>

      <Link href="/dashboard/attendance/new">
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
       Create Attendance
       </button>
      
      </Link>
    </div>
  )
}

export default AttendencePage