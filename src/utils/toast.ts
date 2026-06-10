import { Dispatch, SetStateAction } from 'react';
import { ToastData } from '../components/Toast';

export function showToast(
  setToast: Dispatch<SetStateAction<ToastData | null>>,
  message: string,
  type: ToastData['type'] = 'success',
  durationMs = 4000
): void {
  setToast({ message, type });
  setTimeout(() => {
    setToast((prev) => (prev?.message === message ? null : prev));
  }, durationMs);
}
