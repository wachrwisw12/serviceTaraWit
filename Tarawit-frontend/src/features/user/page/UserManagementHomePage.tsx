import { useEffect } from "react";
import { KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";

import ModuleHero from "../../../components/ModuleHero";
import ModuleCard from "../../../components/ModuleCard";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { Permission } from "../../../store/hooks/permission";
import { fetchUser } from "../UserSlice";
import {
  fetchRolesWithPermissions,
  fetchPermissions,
} from "../../role/api/RoleSlice";

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-dark">
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500">{label}</p>
        {loading ? (
          <p className="text-2xl font-bold text-gray-300">...</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}

const MODULE_LINKS = [
  {
    title: "ผู้ใช้งาน",
    description: "จัดการบัญชีผู้ใช้และกำหนดบทบาท",
    path: "/user/manage",
    permission: Permission.USER_VIEW,
    icon: <Users size={22} />,
    accent: "blue" as const,
  },
  {
    title: "Role",
    description: "จัดการบทบาทและสิทธิ์ของแต่ละบทบาท",
    path: "/roles",
    permission: Permission.ROLE_VIEW,
    icon: <ShieldCheck size={22} />,
    accent: "emerald" as const,
  },
  {
    title: "Permission",
    description: "ดูรายการสิทธิ์ทั้งหมดในระบบ",
    path: "/permissions",
    permission: Permission.PERMISSION_VIEW,
    icon: <KeyRound size={22} />,
    accent: "amber" as const,
  },
];

export default function UserManagementHomePage() {
  const dispatch = useAppDispatch();

  const { user: users, loading: usersLoading } = useAppSelector(
    (state) => state.user,
  );
  const { rolesWithPermissions, permissions, loading } = useAppSelector(
    (state) => state.roleSlice,
  );

  const permissionList = useAppSelector(
    (state) =>
      new Set(state.auth.user?.permissions.map((p) => p.permission_name) ?? []),
  );

  const canViewUser = permissionList.has(Permission.USER_VIEW);
  const canViewRole = permissionList.has(Permission.ROLE_VIEW);
  const canViewPermission = permissionList.has(Permission.PERMISSION_VIEW);

  useEffect(() => {
    if (canViewUser) {
      dispatch(fetchUser());
    }
    if (canViewRole) {
      dispatch(fetchRolesWithPermissions());
    }
    if (canViewPermission) {
      dispatch(fetchPermissions());
    }
  }, [dispatch, canViewUser, canViewRole, canViewPermission]);

  const visibleLinks = MODULE_LINKS.filter((link) =>
    permissionList.has(link.permission),
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        icon={<UserCog size={26} />}
        title="ระบบจัดการผู้ใช้งาน"
        description="จัดการบัญชีผู้ใช้ บทบาท (Role) และสิทธิ์ (Permission) ของผู้ใช้งานในระบบ"
        accent="from-violet-700 to-purple-600"
      />

      {/* การ์ดสรุป */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {canViewUser && (
          <StatCard
            icon={Users}
            label="ผู้ใช้ในระบบ"
            value={users?.length ?? 0}
            loading={usersLoading}
          />
        )}
        {canViewRole && (
          <StatCard
            icon={ShieldCheck}
            label="บทบาท (Role)"
            value={rolesWithPermissions?.length ?? 0}
            loading={loading}
          />
        )}
        {canViewPermission && (
          <StatCard
            icon={KeyRound}
            label="สิทธิ์ (Permission)"
            value={permissions?.length ?? 0}
            loading={loading}
          />
        )}
      </div>

      {/* เมนูของโมดูล */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <UserCog size={18} />
          เมนูของโมดูล
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleLinks.map((link) => (
            <ModuleCard
              key={link.path}
              icon={link.icon}
              title={link.title}
              description={link.description}
              to={link.path}
              accent={link.accent}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
