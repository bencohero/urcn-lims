import { NavLink } from 'react-router-dom';
import { Users, ScrollText, Settings } from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/audit-trail', label: "Piste d'audit", icon: ScrollText },
  { to: '/admin/settings', label: 'Parametres', icon: Settings },
];

export function AdminSubNav() {
  return (
    <div className="border-b border-gray-200 -mt-2 mb-2">
      <nav className="flex gap-1 -mb-px">
        {ADMIN_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
