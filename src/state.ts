import { create } from "zustand";
type UIState = {
  toast: string;
  locked: boolean;
  notify: (message: string) => void;
  setLocked: (locked: boolean) => void;
};
let timeout: ReturnType<typeof setTimeout>;
export const useUI = create<UIState>((set) => ({
  toast: "",
  locked: false,
  setLocked: (locked) => set({ locked }),
  notify: (toast) => {
    clearTimeout(timeout);
    set({ toast });
    timeout = setTimeout(() => set({ toast: "" }), 4500);
  },
}));
