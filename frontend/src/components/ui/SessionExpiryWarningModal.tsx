import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore, STORAGE_KEYS } from '@/store/authStore';
import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  remainingSeconds: number;
  onExtend: () => void;
}

export const SessionExpiryWarningModal = ({ open, remainingSeconds, onExtend }: Props) => {
  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded bg-white p-6 shadow">
          <Dialog.Title className="text-lg font-semibold">Session bientôt expirée</Dialog.Title>

          <Dialog.Description className="mt-2 text-sm text-gray-600">
            Votre session expirera dans{' '}
            <span className="font-semibold text-red-600">{remainingSeconds}s</span>.
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onExtend}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Rester connecté
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
