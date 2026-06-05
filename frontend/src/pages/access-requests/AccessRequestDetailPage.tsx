import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  User,
  Package,
  Calendar,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import {
  useAccessRequestById,
  useApproveRequest,
  useRejectRequest,
  useFulfillRequest,
  useReturnRequest,
  useExtendRequest,
  useCancelRequest,
  useApproveExtension,
} from '@/hooks/useAccessRequests';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatDateTime } from '@/lib/utils/utils';
import { cn } from '@/lib/utils/utils';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation',
  COPY: 'Copie',
  LOAN: 'Pret',
};

const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Basse',
  NORMAL: 'Normale',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

interface WorkflowStep {
  label: string;
  status: string;
  date?: string;
  active: boolean;
  completed: boolean;
}

function getWorkflowSteps(ar: {
  status: string;
  requested_at: string;
  reviewed_at?: string;
  actual_access_date?: string;
  actual_return_date?: string;
}): WorkflowStep[] {
  const statuses = ['PENDING', 'APPROVED', 'FULFILLED', 'RETURNED'];
  const labels = ['Demande', 'Approbation', 'Remise', 'Retour'];
  const dates = [ar.requested_at, ar.reviewed_at, ar.actual_access_date, ar.actual_return_date];

  // OVERDUE is a sub-state of FULFILLED for display purposes
  const displayStatus = ar.status === 'OVERDUE' ? 'FULFILLED' : ar.status;
  const currentIdx = statuses.indexOf(displayStatus);

  return statuses.map((s, i) => ({
    label: labels[i],
    status: s,
    date: dates[i],
    active: i === currentIdx,
    completed: currentIdx >= 0 ? (i < currentIdx || ar.status === 'RETURNED') : false,
  }));
}

export default function AccessRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasRole, user } = useAuthStore();

  const { data: ar, isLoading } = useAccessRequestById(id!);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const fulfillRequest = useFulfillRequest();
  const returnRequest = useReturnRequest();
  const extendRequest = useExtendRequest();
  const cancelRequest = useCancelRequest();
  const approveExtension = useApproveExtension();

  const [modal, setModal] = useState<
    'approve' | 'reject' | 'fulfill' | 'return' | 'extend' | null
  >(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approvedDays, setApprovedDays] = useState('7');
  const [extensionDays, setExtensionDays] = useState('7');
  const [extensionReason, setExtensionReason] = useState('');

  const canApprove = hasRole('ADMIN') || hasRole('ARCHIVIST') || hasRole('INVESTIGATOR');
  const isRequester = ar?.requester?.id === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ar) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Demande introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/access-requests')}>
          Retour a la liste
        </Button>
      </div>
    );
  }

  const steps = getWorkflowSteps(ar);
  const isOverdue = ar.status === 'OVERDUE';
  const isRejected = ar.status === 'REJECTED';
  const isCancelled = ar.status === 'CANCELLED';

  const handleApprove = () => {
    approveRequest.mutate(
      { id: ar.id, payload: { approved_duration_days: Number(approvedDays), review_notes: reviewNotes || undefined } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Demande approuvee' });
          setModal(null);
          setReviewNotes('');
        },
        onError: () => toast({ variant: 'error', title: "Erreur lors de l'approbation" }),
      },
    );
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) return;
    rejectRequest.mutate(
      { id: ar.id, payload: { review_notes: reviewNotes } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Demande rejetee' });
          setModal(null);
          setReviewNotes('');
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors du rejet' }),
      },
    );
  };

  const handleFulfill = () => {
    fulfillRequest.mutate(
      { id: ar.id, payload: { actual_access_date: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Article remis avec succes' });
          setModal(null);
        },
        onError: () => toast({ variant: 'error', title: 'Erreur' }),
      },
    );
  };

  const handleReturn = () => {
    returnRequest.mutate(
      { id: ar.id, payload: { actual_return_date: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Retour enregistre' });
          setModal(null);
        },
        onError: () => toast({ variant: 'error', title: 'Erreur' }),
      },
    );
  };

  const handleExtend = () => {
    if (!extensionReason.trim() || extensionReason.trim().length < 10) return;
    extendRequest.mutate(
      { id: ar.id, payload: { extension_days: Number(extensionDays), extension_reason: extensionReason } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Demande de prolongation envoyee' });
          setModal(null);
          setExtensionReason('');
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors de la demande de prolongation' }),
      },
    );
  };

  const handleCancel = () => {
    cancelRequest.mutate(ar.id, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Demande annulee' });
      },
      onError: () => toast({ variant: 'error', title: "Erreur lors de l'annulation" }),
    });
  };

  const handleApproveExtension = () => {
    approveExtension.mutate(ar.id, {
      onSuccess: () => {
        toast({ variant: 'success', title: 'Prolongation approuvee' });
      },
      onError: () => toast({ variant: 'error', title: "Erreur lors de l'approbation de la prolongation" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/access-requests')}
        >
          Retour
        </Button>
      </div>

      <PageHeader
        title={`Demande ${ar.request_number}`}
        description={`${REQUEST_TYPE_LABELS[ar.request_type] ?? ar.request_type} — ${ar.items?.length ?? 0} article(s)`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={ar.status} />
            {isOverdue && (
              <Badge variant="danger">
                <AlertTriangle className="h-3 w-3 mr-1" />
                En retard
              </Badge>
            )}
          </div>
        }
      />

      {/* Workflow Timeline */}
      {!isRejected && !isCancelled && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <div key={step.status} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
                        step.completed
                          ? 'border-green-500 bg-green-500 text-white'
                          : step.active
                            ? isOverdue && step.status === 'FULFILLED'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 bg-white text-gray-400',
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : step.active && isOverdue && step.status === 'FULFILLED' ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-700">{step.label}</p>
                    {step.date && (
                      <p className="text-xs text-gray-400">{formatDate(step.date)}</p>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-2',
                        step.completed ? 'bg-green-500' : 'bg-gray-200',
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Approve/Reject — admin roles only */}
        {canApprove && ar.status === 'PENDING' && (
          <>
            <Button
              variant="primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => setModal('approve')}
            >
              Approuver
            </Button>
            <Button
              variant="danger"
              icon={<XCircle className="h-4 w-4" />}
              onClick={() => setModal('reject')}
            >
              Rejeter
            </Button>
          </>
        )}

        {/* Fulfill — admin/archivist */}
        {canApprove && ar.status === 'APPROVED' && (
          <Button
            variant="primary"
            icon={<Truck className="h-4 w-4" />}
            onClick={() => setModal('fulfill')}
          >
            Marquer comme remis
          </Button>
        )}

        {/* Return — admin/archivist */}
        {canApprove && (ar.status === 'FULFILLED' || ar.status === 'OVERDUE') && (
          <Button
            variant="primary"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => setModal('return')}
          >
            Enregistrer le retour
          </Button>
        )}

        {/* Request extension — requester when FULFILLED/OVERDUE and no extension pending */}
        {(ar.status === 'FULFILLED' || ar.status === 'OVERDUE') &&
          !ar.extension_requested && (
            <Button
              variant="outline"
              icon={<Clock className="h-4 w-4" />}
              onClick={() => setModal('extend')}
            >
              Demander une prolongation
            </Button>
          )}

        {/* Approve extension — admin/archivist when extension pending */}
        {canApprove && ar.extension_requested && ar.extension_approved === null && (
          <Button
            variant="primary"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={handleApproveExtension}
            loading={approveExtension.isPending}
          >
            Approuver la prolongation ({ar.extension_days} j)
          </Button>
        )}

        {/* Cancel — requester when PENDING */}
        {ar.status === 'PENDING' && (isRequester || canApprove) && (
          <Button
            variant="outline"
            icon={<XCircle className="h-4 w-4" />}
            onClick={handleCancel}
            loading={cancelRequest.isPending}
          >
            Annuler la demande
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Request Info */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Details de la demande
              {/* {user && (
                <Badge variant="default" className="ml-auto">
                  roles: {user.roles.map((r) => r.name).join(', ')}
                </Badge>
              )} */}
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="N. demande" value={ar.request_number} />
              <InfoItem label="Type" value={REQUEST_TYPE_LABELS[ar.request_type] ?? ar.request_type} />
              <InfoItem label="Urgence" value={URGENCY_LABELS[ar.urgency] ?? ar.urgency} />
              <InfoItem label="Objet" value={ar.purpose} />
              {ar.required_by_date && (
                <InfoItem label="Requise avant" value={formatDate(ar.required_by_date)} />
              )}
              {ar.approved_duration_days && (
                <InfoItem label="Duree approuvee" value={`${ar.approved_duration_days} jours`} />
              )}
              {ar.expected_return_date && (
                <InfoItem label="Retour prevu" value={formatDate(ar.expected_return_date)} />
              )}
              {ar.extension_requested && (
                <div className="col-span-2">
                  <Badge variant={ar.extension_approved ? 'success' : ar.extension_approved === false ? 'danger' : 'orange'}>
                    Prolongation {ar.extension_approved ? 'approuvee' : ar.extension_approved === false ? 'refusee' : 'en attente'} ({ar.extension_days} j)
                  </Badge>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Requester */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Demandeur
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Nom" value={ar.requester.name} />
              <InfoItem label="Email" value={ar.requester.email} />
              <InfoItem label="Site" value={ar.requester_site?.name || '-'} />
            </dl>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articles concernes
              <span className="ml-auto text-xs font-normal text-gray-400">
                {ar.items?.length ?? 0} article(s)
              </span>
            </h3>
          </CardHeader>
          <CardContent>
            {(ar.items ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">Aucun article</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {(ar.items ?? []).map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.internal_code ?? item.id.slice(0, 8)}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {item.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Chronologie
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Demandee le" value={formatDateTime(ar.requested_at)} />
              {ar.reviewed_at && (
                <>
                  <InfoItem label="Revue le" value={formatDateTime(ar.reviewed_at)} />
                  {ar.reviewed_by && (
                    <InfoItem label="Par" value={ar.reviewed_by.name} />
                  )}
                </>
              )}
              {ar.review_notes && (
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-500">Notes de revision</dt>
                  <dd className="mt-0.5 text-sm text-gray-900 bg-gray-50 rounded-md p-2">
                    {ar.review_notes}
                  </dd>
                </div>
              )}
              {ar.actual_access_date && (
                <InfoItem label="Remis le" value={formatDateTime(ar.actual_access_date)} />
              )}
              {ar.actual_return_date && (
                <InfoItem label="Retourne le" value={formatDateTime(ar.actual_return_date)} />
              )}
              {ar.was_late && (
                <div className="col-span-2">
                  <Badge variant="danger">Retour en retard</Badge>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Approve Modal */}
      <Modal
        open={modal === 'approve'}
        onOpenChange={(open) => !open && setModal(null)}
        title="Approuver la demande"
        description={`Demande ${ar.request_number}`}
      >
        <div className="space-y-4">
          <Input
            label="Duree du pret (jours)"
            type="number"
            min={1}
            max={90}
            value={approvedDays}
            onChange={(e) => setApprovedDays(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Notes (optionnel)</label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Notes pour le demandeur..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button onClick={handleApprove} loading={approveRequest.isPending}>
              Approuver
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={modal === 'reject'}
        onOpenChange={(open) => !open && setModal(null)}
        title="Rejeter la demande"
        description={`Demande ${ar.request_number}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Motif du rejet *</label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Indiquez le motif du rejet (min. 10 caracteres)..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={rejectRequest.isPending}
              disabled={reviewNotes.trim().length < 10}
            >
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Fulfill Modal */}
      <Modal
        open={modal === 'fulfill'}
        onOpenChange={(open) => !open && setModal(null)}
        title="Confirmer la remise"
        description="Les articles vont etre marques comme remis au demandeur"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirmez-vous que les <span className="font-medium">{ar.items?.length ?? 0} article(s)</span>{' '}
            ont ete physiquement remis a{' '}
            <span className="font-medium">{ar.requester.name}</span> ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button onClick={handleFulfill} loading={fulfillRequest.isPending}>
              Confirmer la remise
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        open={modal === 'return'}
        onOpenChange={(open) => !open && setModal(null)}
        title="Enregistrer le retour"
        description="Les articles vont etre marques comme retournes"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirmez-vous que les <span className="font-medium">{ar.items?.length ?? 0} article(s)</span>{' '}
            ont ete retournes par{' '}
            <span className="font-medium">{ar.requester.name}</span> ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button onClick={handleReturn} loading={returnRequest.isPending}>
              Confirmer le retour
            </Button>
          </div>
        </div>
      </Modal>

      {/* Extend Modal */}
      <Modal
        open={modal === 'extend'}
        onOpenChange={(open) => !open && setModal(null)}
        title="Demander une prolongation"
        description={`Demande ${ar.request_number} — max. 14 jours`}
      >
        <div className="space-y-4">
          <Input
            label="Nombre de jours supplementaires"
            type="number"
            min={1}
            max={14}
            value={extensionDays}
            onChange={(e) => setExtensionDays(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Motif de la prolongation *</label>
            <Textarea
              value={extensionReason}
              onChange={(e) => setExtensionReason(e.target.value)}
              placeholder="Justifiez la demande de prolongation (min. 10 caracteres)..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button
              onClick={handleExtend}
              loading={extendRequest.isPending}
              disabled={extensionReason.trim().length < 10}
            >
              Envoyer la demande
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
