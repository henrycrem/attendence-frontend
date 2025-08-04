import { Suspense } from "react"

import SetPasswordForm from '@/components/setPassword'
import React from 'react'



export const dynamic = "force-dynamic"


const SetPassword = () => {
  return (
    <div>

      <SetPasswordForm/>
    </div>
  )
}

export default SetPassword