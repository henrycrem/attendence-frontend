import PatientsOverview from '@/shared/widgets/dashboard/patient-overview'
import PatientsTable from '@/shared/widgets/dashboard/patientsTable'
import ReportSection from '@/shared/widgets/dashboard/report-sec'
import StatCards from '@/shared/widgets/dashboard/startsCard'
import React from 'react'

const DashboardPage = () => {
  return (
    <div>
        <div className="p-6">
          <StatCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <ReportSection />
            <PatientsOverview />
          </div>
          <PatientsTable />
        </div>
    </div>
  )
}

export default DashboardPage