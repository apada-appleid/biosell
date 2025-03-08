import { create } from 'zustand';

interface ToastButton {
  label: string;
  onClick: () => void;
  autoDismiss?: boolean;
}

interface ToastState {
  message: string;
  isVisible: boolean;
  type: 'success' | 'error' | 'info';
  actionButtons?: ToastButton[];
  showToast: (
    message: string, 
    actionButtons?: ToastButton[], 
    type?: 'success' | 'error' | 'info',
    autoDismissTime?: number
  ) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: '',
  isVisible: false,
  type: 'success',
  actionButtons: undefined,
  
  showToast: (message, actionButtons, type = 'success', autoDismissTime = 5000) => {
    // First hide any existing toast
    if (get().isVisible) {
      set({ isVisible: false });
      
      // Short delay to allow animation to complete before showing new toast
      setTimeout(() => {
        set({ 
          message, 
          isVisible: true, 
          actionButtons,
          type
        });
      }, 300);
    } else {
      set({ 
        message, 
        isVisible: true, 
        actionButtons,
        type
      });
    }
    
    // Set up auto-dismiss if specified
    if (autoDismissTime > 0) {
      setTimeout(() => {
        // Only hide if this is still the same toast
        if (get().message === message && get().isVisible) {
          set({ isVisible: false });
        }
      }, autoDismissTime);
    }
  },
  
  hideToast: () => set({ 
    isVisible: false,
    actionButtons: undefined
  }),
})); 