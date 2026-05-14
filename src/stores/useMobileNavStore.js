import { create } from 'zustand';

/**
 * Slide-out sidebar on small viewports. Desktop ignores open state via CSS.
 */
const useMobileNavStore = create((set) => ({
  drawerOpen: false,
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
  closeDrawer: () => set({ drawerOpen: false }),
}));

export default useMobileNavStore;
