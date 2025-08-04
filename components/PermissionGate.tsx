

// components/ProtectedRoute.tsx  
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { usePermissions, Permission } from '../hooks/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  permission,
  permissions = [],
  requireAll = false,
  redirectTo = '/unauthorized',
  fallback
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, user } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    let hasAccess = true;

    if (permission) {
      hasAccess = hasPermission(permission);
    } else if (permissions.length > 0) {
      hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    }

    if (!hasAccess) {
      router.push(redirectTo);
    }
  }, [user, permission, permissions, requireAll, redirectTo, router, hasPermission, hasAnyPermission, hasAllPermissions]);

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  if (!user || !hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">You don't have permission to view this content.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}