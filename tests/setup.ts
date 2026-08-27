// Vitest setup file
import "@testing-library/jest-dom";

// Boneyard: jsdom lacks matchMedia / ResizeObserver — mock for Skeleton
if (typeof window !== "undefined" && !window.matchMedia) {
	(window as any).matchMedia = (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	});
}
if (typeof window !== "undefined" && !(window as any).ResizeObserver) {
	class ResizeObserverMock {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	(window as any).ResizeObserver = ResizeObserverMock as any;
	(global as any).ResizeObserver = ResizeObserverMock as any;
}
