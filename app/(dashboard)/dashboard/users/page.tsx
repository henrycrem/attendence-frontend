import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { UsersTable } from '@/components/users-table';
import { getAllUsersAction, getUserStatsAction } from '@/actions/user';
import { getRoles, getDepartments } from '@/actions/auth';
import { checkAuthStatus } from '@/actions/auth';

export const dynamic = "force-dynamic"

async function UsersPageContent() {
  const authResult = await checkAuthStatus();

  if (!authResult.isAuthenticated) {
    redirect('/login');
  }

  if (authResult.user?.role?.roleName !== 'super_admin') {
    redirect('/dashboard');
  }

  const [usersResult, statsResult, rolesResult, departmentsResult] = await Promise.all([
    getAllUsersAction({ limit: 50 }),
    getUserStatsAction(),
    getRoles(),
    getDepartments(),
  ]);

  if (!usersResult.success) {
    throw new Error(usersResult.error || 'Failed to fetch users');
  }

  if (!statsResult.success) {
    throw new Error(statsResult.error || 'Failed to fetch statistics');
  }

  const users = usersResult.data.users || [];
  const stats = statsResult.data.stats || {};
  const roles = rolesResult.success ? rolesResult.data : [];
  const departments = departmentsResult.success ? departmentsResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage all users in the system. Only super administrators can access this page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.offlineUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Currently offline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Last 5 new users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users in the system. You can edit, delete, or change user status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} roles={roles} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <UsersPageContent />
    </Suspense>
  );
}