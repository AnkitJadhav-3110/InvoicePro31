import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsPDF needs a canvas; jsdom's is fine for our blob-output tests.
if (!(globalThis as any).URL.createObjectURL) {
  (globalThis as any).URL.createObjectURL = () => 'blob:mock';
}
