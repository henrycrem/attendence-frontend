import { markNotificationAsRead } from "./notificationSlice"

// Updated notification handler that opens drawers instead of routing
export const handleInsuranceNotificationClick = (
  notification: any,
  router: any,
  dispatch: any,
  setDrawerData: any,
  setDrawerOpen: any,
) => {
  // Mark as read locally (server marking handled by the hook)
  dispatch(markNotificationAsRead(notification.id))

  // Handle different notification types with drawers
  if (notification.type === "INSURANCE_SELECTED") {
    // Open drawer for insurance selection notifications
    setDrawerData({
      id: notification.id,
      type: "INSURANCE_SELECTED",
      patientName: notification.data?.patientName || "Unknown Patient",
      patientNumber: notification.data?.patientNumber || "N/A",
      patientId: notification.data?.patientId,
      visitId: notification.data?.visitId,
      insuranceCompany: notification.data?.insuranceName || "Insurance Provider",
      policyNumber: notification.data?.policyNumber,
      timestamp: notification.timestamp,
      message: notification.message,
      title: notification.title,
      actionRequired: notification.data?.actionRequired,
    })
    setDrawerOpen(true)
  } else if (notification.type === "INSURANCE_CONFIRMED" || notification.type === "INSURANCE_REJECTED") {
    // Open drawer for insurance response notifications
    setDrawerData({
      id: notification.id,
      type: notification.type,
      patientName: notification.data?.patientName || "Unknown Patient",
      patientNumber: notification.data?.patientNumber || "N/A",
      policyNumber: notification.data?.coverageDetails?.policyNumber,
      response: notification.type === "INSURANCE_CONFIRMED" ? "CONFIRMED" : "REJECTED",
      coverageDetails: notification.data?.coverageDetails,
      rejectionReason: notification.data?.rejectionReason,
      notes: notification.data?.notes,
      timestamp: notification.timestamp,
      insuranceCompany:
        notification.data?.insuranceName || notification.data?.respondedBy?.insurance || "Insurance Provider",
      respondedBy: notification.data?.respondedBy,
      actionRequired: notification.data?.actionRequired,
    })
    setDrawerOpen(true)
  } else if (notification.type === "INSURANCE_CLAIM_RESPONSE") {
    // Handle existing claim response logic
    setDrawerData({
      id: notification.id,
      type: "INSURANCE_CLAIM_RESPONSE",
      patientName: notification.data?.patientName || "Unknown Patient",
      patientNumber: notification.data?.patientNumber || "N/A",
      policyNumber: notification.data?.policyNumber,
      response: notification.data?.status || "CONFIRMED",
      coverageDetails: notification.data?.coverageDetails,
      rejectionReason: notification.data?.reason,
      notes: notification.data?.notes,
      timestamp: notification.timestamp,
      insuranceCompany: notification.data?.insuranceCompany || "Insurance Provider",
    })
    setDrawerOpen(true)
  } else {
    // Handle other notification types with drawer as well
    setDrawerData({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      data: notification.data,
    })
    setDrawerOpen(true)
  }
}
