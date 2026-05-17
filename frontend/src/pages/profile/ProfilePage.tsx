import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Shield, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/lib/api/users';
import { getInitials } from '@/lib/utils/utils';
import type { UpdateUserRequest } from '@/lib/api/users';
import { ChangePasswordRequest } from '@/types';


// ─── Zod schemas ────────────────────────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
    new_password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirm_password: z.string().min(1, 'La confirmation est requise'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ─── Role badge colour mapping ───────────────────────────────────────────────

const ROLE_BADGE_VARIANT: Record<
  string,
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange' | 'default'
> = {
  ADMIN: 'danger',
  INVESTIGATOR: 'primary',
  ARC: 'info',
  MONITOR: 'success',
  ARCHIVIST: 'purple',
  DATA_MANAGER: 'orange',
  DATA_CLERK: 'default',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setAuth, access_token, refresh_token } = useAuthStore();
  const { toast } = useToast();

  // ── Profile form ──────────────────────────────────────────────────────────

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  });

  // Keep form in sync when user changes in store
  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone ?? '',
      });
    }
  }, [user, resetProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateUserRequest) =>
      usersApi.update(user!.id, payload),
    onSuccess: (updatedUser) => {
      // Persist new user data in the auth store while keeping tokens intact
      if (access_token && refresh_token) {
        setAuth(updatedUser, access_token, refresh_token);
      }
      toast({ variant: 'success', title: 'Profil mis à jour avec succès' });
    },
    onError: () => {
      toast({ variant: 'error', title: 'Erreur lors de la mise à jour du profil' });
    },
  });

  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone || undefined,
    });
  };

  // ── Password form ─────────────────────────────────────────────────────────

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordRequest) =>
      usersApi.changePassword(user!.id, payload),
    onSuccess: () => {
      toast({ variant: 'success', title: 'Mot de passe modifié avec succès' });
      resetPassword();
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 400 || status === 401) {
        toast({ variant: 'error', title: 'Mot de passe actuel incorrect' });
      } else {
        toast({ variant: 'error', title: 'Erreur lors du changement de mot de passe' });
      }
    },
  });

  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePasswordMutation.mutate({
      current_password: values.current_password,
      new_password: values.new_password,
      confirm_password: values.confirm_password,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Utilisateur non connecté</p>
      </div>
    );
  }

  const initials = getInitials(user.first_name, user.last_name);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Consultez et modifiez vos informations personnelles"
      />

      {/* ── Section 1 : Identité ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            Identité
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold select-none">
                {initials}
              </div>
              <span
                className={
                  user.is_active
                    ? 'text-xs font-medium text-green-600'
                    : 'text-xs font-medium text-red-600'
                }
              >
                {user.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <p className="text-sm text-gray-600 mt-0.5">{user.email}</p>
                {user.phone && (
                  <p className="text-sm text-gray-600">{user.phone}</p>
                )}
              </div>

              {/* Roles */}
              {user.roles.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Rôles
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((role) => (
                      <Badge
                        key={role.code}
                        variant={ROLE_BADGE_VARIANT[role.code] ?? 'default'}
                      >
                        {role.name ?? role.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sites */}
              {user.sites.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Sites assignés
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.sites.map((site) => (
                      <Badge key={site.id} variant="default">
                        {site.site_number} — {site.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2 : Modifier le profil ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            Modifier le profil
          </h2>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Prénom"
                required
                error={profileErrors.first_name?.message}
                {...registerProfile('first_name')}
              />
              <Input
                label="Nom"
                required
                error={profileErrors.last_name?.message}
                {...registerProfile('last_name')}
              />
            </div>
            <Input
              label="Adresse email"
              type="email"
              required
              error={profileErrors.email?.message}
              {...registerProfile('email')}
            />
            <Input
              label="Téléphone"
              type="tel"
              placeholder="+33 6 00 00 00 00"
              error={profileErrors.phone?.message}
              {...registerProfile('phone')}
            />
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                loading={updateProfileMutation.isPending}
              >
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Section 3 : Changer le mot de passe ─────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Changer le mot de passe
          </h2>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            noValidate
            className="space-y-4"
          >
            <Input
              label="Mot de passe actuel"
              type="password"
              required
              error={passwordErrors.current_password?.message}
              {...registerPassword('current_password')}
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              required
              helperText="Minimum 8 caractères"
              error={passwordErrors.new_password?.message}
              {...registerPassword('new_password')}
            />
            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              required
              error={passwordErrors.confirm_password?.message}
              {...registerPassword('confirm_password')}
            />
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                loading={changePasswordMutation.isPending}
              >
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
