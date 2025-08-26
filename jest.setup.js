import "@testing-library/jest-dom";

// Mock Web Speech API
Object.defineProperty(window, "speechSynthesis", {
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
  },
  writable: true,
});

// Mock Audio API
Object.defineProperty(window, "Audio", {
  value: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    src: "",
  })),
  writable: true,
});
