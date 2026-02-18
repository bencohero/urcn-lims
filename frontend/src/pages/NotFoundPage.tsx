import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-50">
          <FileQuestion className="h-12 w-12 text-primary-500" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-gray-700">
          Page non trouvee
        </h2>
        <p className="mt-2 text-gray-500">
          La page que vous recherchez n'existe pas ou a ete deplacee.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Retour
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
