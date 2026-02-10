import { useNavigate } from 'react-router-dom';
import { Plus, FileText, ClipboardList, Tag, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const defaultActions: QuickAction[] = [
  { label: 'Nouveau document', icon: <FileText className="h-4 w-4" />, href: '/documents', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { label: 'Nouvelle demande', icon: <ClipboardList className="h-4 w-4" />, href: '/access-requests', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { label: 'Scanner RFID', icon: <Tag className="h-4 w-4" />, href: '/rfid', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { label: 'Generer rapport', icon: <BarChart3 className="h-4 w-4" />, href: '/reports', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
];

interface QuickActionsProps {
  actions?: QuickAction[];
}

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-500" />
          Actions rapides
        </h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.href)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${action.color}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
