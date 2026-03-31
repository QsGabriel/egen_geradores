/**
 * Type declarations for html2pdf.js
 */
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: 'jpeg' | 'png' | 'webp' | string;
      quality?: number;
    };
    enableLinks?: boolean;
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      allowTaint?: boolean;
      logging?: boolean;
      backgroundColor?: string;
      windowWidth?: number;
      windowHeight?: number;
    };
    jsPDF?: {
      unit?: 'pt' | 'mm' | 'cm' | 'in' | string;
      format?: string | number[];
      orientation?: 'portrait' | 'landscape' | string;
      compress?: boolean;
    };
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: HTMLElement | string): Html2PdfWorker;
    save(): Promise<void>;
    outputPdf(type?: 'blob' | 'datauristring' | 'arraybuffer'): Promise<Blob | string | ArrayBuffer>;
    toPdf(): Html2PdfWorker;
    get(type: string): Promise<any>;
  }

  function html2pdf(): Html2PdfWorker;
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2PdfWorker;
  
  export default html2pdf;
}
