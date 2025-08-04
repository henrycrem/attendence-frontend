
import CreateRoleForm from "apps/user-ui/src/shared/widgets/dashboard/CreateRoleForm";

export default function RolesPage({ user, error }: { user: any; error: string | null }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Roles Management</h1>
      <CreateRoleForm />
    </div>
  );
}

