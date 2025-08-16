import '@testing-library/jest-dom';

if (typeof window !== 'undefined' && !window.matchMedia) {
	window.matchMedia = function (query) {
		return {
			matches: false,
			media: query,
			onchange: null,
			addListener: function () {}, // deprecated
			removeListener: function () {}, // deprecated
			addEventListener: function () {},
			removeEventListener: function () {},
			dispatchEvent: function () {
				return false;
			},
		};
	};
}
