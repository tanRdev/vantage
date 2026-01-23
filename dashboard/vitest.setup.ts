import { beforeAll, afterEach, afterAll, vi } from "vitest";
import "@testing-library/jest-dom";

// Global ResizeObserver mock tracking
declare global {
  var __resizeObserverInstances: any[];
}

beforeAll(() => {
  // Setup before all tests

  // Create a trackable ResizeObserver mock
  const createResizeObserverMock = () => {
    globalThis.__resizeObserverInstances = [];

    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        const instance = {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          callback,
        };
        globalThis.__resizeObserverInstances.push(instance);
      }
    }

    // @ts-ignore
    global.ResizeObserver = MockResizeObserver;
  };

  createResizeObserverMock();
});

afterEach(() => {
  // Cleanup after each test
  globalThis.__resizeObserverInstances = [];
});

afterAll(() => {
  // Cleanup after all tests
});
