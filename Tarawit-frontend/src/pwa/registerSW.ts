import { registerSW } from "virtual:pwa-register";

let updateCallback: (() => void) | null = null;

export const setUpdateCallback = (callback: () => void) => {
  updateCallback = callback;
};

export const updateSW = registerSW({
  immediate: true,

  onRegisteredSW(_, registration) {
    registration?.update();

    setInterval(() => {
      registration?.update();
    }, 60_000);
  },

  onNeedRefresh() {
    updateCallback?.();
  },

  onOfflineReady() {
    console.log("PWA พร้อมใช้งานแบบออฟไลน์");
  },
});
