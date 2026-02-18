import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLogin } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

const loginSchema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(data, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Connexion reussie' });
        navigate(from, { replace: true });
      },
      onError: (error: Error) => {
        toast({
          variant: 'error',
          title: 'Echec de connexion',
          description: error.message || 'Identifiants invalides',
        });
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl">
            CS
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Clinical Storage System
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Connectez-vous pour acceder au systeme de stockage
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nom d'utilisateur"
              placeholder="Entrez votre identifiant"
              iconLeft={<User className="h-4 w-4" />}
              error={errors.username?.message}
              required
              autoComplete="username"
              {...register('username')}
            />

            <div>
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="Entrez votre mot de passe"
                iconLeft={<Lock className="h-4 w-4" />}
                iconRight={
                  <button
                    type="button"
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                required
                autoComplete="current-password"
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={login.isPending}
            >
              Se connecter
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Systeme conforme GCP/ICH &bull; GDPR
        </p>
      </div>
    </div>
  );
}
