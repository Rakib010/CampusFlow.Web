import { create } from 'zustand';

let nextId = 0;

const useToastStore = create((set) => ({
  toasts: [],

  show: (message, type = 'info', duration = 4000) => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  success: (msg) => useToastStore.getState().show(msg, 'success'),
  error: (msg) => useToastStore.getState().show(msg, 'error'),
  info: (msg) => useToastStore.getState().show(msg, 'info'),
  warning: (msg) => useToastStore.getState().show(msg, 'warning'),

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export default useToastStore;
