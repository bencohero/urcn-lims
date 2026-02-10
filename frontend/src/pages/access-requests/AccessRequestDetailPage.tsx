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
} from '@/hooks/useAccessRequests';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatDateTime } from '@/lib/utils/utils';
import { cn } from '@/lib/utils/utils';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation',
  LOAN: 'Pret',
  TRANSFER: 'Transfert',
};

const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
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

function getWorkflowSteps(ar: { status: string; requested_at: string; reviewed_at?: string; actual_access_date?: string; actual_return_date?: string }): WorkflowStep[] {
  const statuses = ['PENDING', 'APPROVED', 'FULFILLED', 'RETURNED'];
  const labels = ['Demande', 'Approbation', 'Remise', 'Retour'];
  const dates = [ar.requested_at, ar.reviewed_at, ar.actual_access_date, ar.actual_return_date];

  const currentIdx = statuses.indexOf(ar.status);

  return statuses.map((s, i) => ({
    label: labels[i],
    status: s,
    date: dates[i],
    active: i === currentIdx,
    completed: i < currentIdx || ar.status === 'RETURNED',
  }));
}

export default function AccessRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasRole } = useAuthStore();

  const { data: ar, isLoading } = useAccessRequestById(id!);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const fulfillRequest = useFulfillRequest();
  const returnRequest = useReturnRequest();

  const [modal, setModal] = useState<'approve' | 'reject' | 'fulfill' | 'return' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approvedDays, setApprovedDays] = useState('7');

  const canApprove = hasRole('ADMIN') || hasRole('ARCHIVIST') || hasRole('INVESTIGATOR');

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

  const handleApprove = () => {
    approveRequest.mutate(
      { id: ar.id, payload: { approved_duration_days: Number(approvedDays), review_notes: reviewNotes || undefined } },
      {
        onSuccess: () => {
          toast({ variant: 'success', title: 'Demande approuvee' });
          setModal(null);
          setReviewNotes('');
        },
        onError: () => toast({ variant: 'error', title: 'Erreur lors de l\'approbation' }),
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
        description={`${REQUEST_TYPE_LABELS[ar.request_type]} - ${ar.item.description}`}
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
      {!isRejected && (
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
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 bg-white text-gray-400',
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
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
      {canApprove && (
        <div className="flex items-center gap-3">
          {ar.status === 'PENDING' && (
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
          {ar.status === 'APPROVED' && (
            <Button
              variant="primary"
              icon={<Truck className="h-4 w-4" />}
              onClick={() => setModal('fulfill')}
            >
              Marquer comme remis
            </Button>
          )}
          {(ar.status === 'FULFILLED' || ar.status === 'OVERDUE') && (
            <Button
              variant="primary"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setModal('return')}
            >
              Enregistrer le retour
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Request Info */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Details de la demande
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="N. demande" value={ar.request_number} />
              <InfoItem label="Type" value={REQUEST_TYPE_LABELS[ar.request_type]} />
              <InfoItem label="Urgence" value={URGENCY_LABELS[ar.urgency]} />
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

        {/* Item */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Article concerne
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Type" value={ar.item.type} />
              <InfoItem label="Description" value={ar.item.description} />
              <InfoItem label="ID" value={ar.item.id.slice(0, 8)} />
            </dl>
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
              placeholder="Indiquez le motif du rejet..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={rejectRequest.isPending}
              disabled={!reviewNotes.trim()}
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
        description="L'article va etre marque comme remis au demandeur"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirmez-vous que l'article <span className="font-medium">{ar.item.description}</span> a ete
            physiquement remis a <span className="font-medium">{ar.requester.name}</span> ?
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
        description="L'article va etre marque comme retourne"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirmez-vous que l'article <span className="font-medium">{ar.item.description}</span> a ete
            retourne par <span className="font-medium">{ar.requester.name}</span> ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Annuler</Button>
            <Button onClick={handleReturn} loading={returnRequest.isPending}>
              Confirmer le retour
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
