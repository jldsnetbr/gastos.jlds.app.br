import type { Dispatch, SetStateAction } from 'react';
import type { ToastData } from '../components/Toast';

export function showToast(
  setToast: Dispatch<SetStateAction<ToastData | null>>,
  message: string,
  type: ToastData['type'] = 'success',
  durationMsOrAction: number | ToastData['action'] = 4000
): void {
  let action: ToastData['action'] | undefined;
  let durationMs = 4000;

  if (typeof durationMsOrAction === 'number') {
    durationMs = durationMsOrAction;
  } else if (durationMsOrAction && typeof durationMsOrAction === 'object') {
    action = durationMsOrAction;
    durationMs = 6000; // Longer duration for undo toasts
  }

  setToast({ message, type, action });
  setTimeout(() => {
    setToast((prev) => (prev?.message === message ? null : prev));
  }, durationMs);
}
