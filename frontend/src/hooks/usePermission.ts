import { useAuth } from '../contexts/AuthContext';

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permissionCode: string): boolean => {
    if (!user || !user.permissions) return false;
    if (user.roles?.includes('ADMIN') || user.userType === 'Admin') return true;
    return user.permissions.includes(permissionCode);
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(roleName);
  };

  return { hasPermission, hasRole, isAdmin: user?.userType === 'Admin' || user?.roles?.includes('ADMIN') };
};
