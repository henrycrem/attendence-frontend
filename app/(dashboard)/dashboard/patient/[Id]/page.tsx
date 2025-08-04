import { getPatientById } from 'apps/user-ui/src/actions/patientActions'; 
import PatientDetail from 'apps/user-ui/src/components/patientDetails';

export default async function PatientDetailPage({ params }: { params: { id?: string; Id?: string } }) {
  console.log('PatientDetailPage: Full params:', JSON.stringify(params, null, 2));

  // Try both 'id' and 'Id' to handle case mismatch
  const id = params.id || params.Id;
  console.log('PatientDetailPage: Extracted patient ID:', id);

  if (!id) {
    console.error('PatientDetailPage: No patient ID provided in params');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">No patient ID provided</div>
      </div>
    );
  }

  let patient;
  try {
    patient = await getPatientById(id);
    console.log('PatientDetailPage: getPatientById result:', JSON.stringify(patient, null, 2));
  } catch (error: any) {
    console.error('PatientDetailPage: Error:', error.message);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">{error.message || 'Failed to load patient'}</div>
      </div>
    );
  }

  return <PatientDetail initialPatient={patient} />;
}