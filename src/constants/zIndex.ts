export const Z_INDEX = {
  /** Default page content */
  page: 0,
  /** Dropdowns, tooltips, popovers */
  dropdown: 50,
  /** Toast notifications — must render above all modals */
  notification: 10000,
  /** Modal backdrops — action/creation modals */
  modal: 9999,
  /** Modal backdrops — detail/view modals (below action modals) */
  modalDetail: 9998,
  /** Confirmation dialogs — must render above modals */
  confirmDialog: 10001,
  /** Inline error banners inside modals */
  errorBanner: 10,
} as const;
