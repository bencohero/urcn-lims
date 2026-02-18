import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: data.email });
    } catch {
      // Show success regardless for security (don't reveal whether email exists)
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Email envoye
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Si un compte existe avec cette adresse, vous recevrez un lien de reinitialisation.
              </p>
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Retour a la connexion
              </Button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>

              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                  <Mail className="h-6 w-6 text-primary-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 text-center">
                  Mot de passe oublie
                </h1>
                <p className="mt-1 text-sm text-gray-500 text-center">
                  Entrez votre adresse email pour recevoir un lien de reinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Adresse email"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  error={errors.email?.message}
                  iconLeft={<Mail className="h-4 w-4" />}
                  {...register('email')}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Envoyer le lien
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
