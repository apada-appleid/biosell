import { create } from 'zustand';

interface ToastState {
  message: string;
  isVisible: boolean;
  actionButtons?: Array<{
    label: string;
    onClick: () => void;
  }>;
  showToast: (message: string, actionButtons?: Array<{ label: string, onClick: () => void }>) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  isVisible: false,
  actionButtons: undefined,
  
  showToast: (message, actionButtons) => set({ 
    message, 
    isVisible: true, 
    actionButtons 
  }),
  
  hideToast: () => set({ 
    isVisible: false,
    actionButtons: undefined
  }),
})); 