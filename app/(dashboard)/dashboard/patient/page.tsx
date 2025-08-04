import { getPatients } from 'apps/user-ui/src/actions/triageActions'; 
import PatientsList from 'apps/user-ui/src/components/patientList';

export default async function PatientsPage({ searchParams }: { searchParams: { search?: string } }) {
  const search = searchParams.search || '';
  let initialData;

  try {
    const result = await getPatients({ search, limit: 10, offset: 0 });
    // If getPatients returns an array, wrap it in the expected object shape
    if (Array.isArray(result)) {
      initialData = { data: result, count: result.length, totalCount: result.length };
    } else {
      initialData = result;
    }
  } catch (error: any) {
    initialData = { data: [], count: 0, totalCount: 0 };
    console.error('Failed to fetch patients:', error.message);
  }

  return <PatientsList initialData={initialData} initialSearch={search} />;
}