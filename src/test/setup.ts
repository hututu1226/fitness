import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  configurable: true,
  value: () => {},
})
