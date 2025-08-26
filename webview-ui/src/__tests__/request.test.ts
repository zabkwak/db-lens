import { expect, vi } from 'vitest';
import { EQueryCommand } from '../../../shared/types';
import Request from '../request';

describe('Request', () => {
	afterEach(() => {
		vi.clearAllMocks();
		// @ts-expect-error _requests is private property
		Request._requests.clear();
	});

	describe('.handleMessage', () => {
		it('should resolve the promise if message does not contain requestId', () => {
			expect(
				Request.handleMessage({
					command: 'query',
					payload: { query: 'test' },
				}),
			).toBeUndefined();
		});

		it('should resolve the promise if requestId is not registered', () => {
			expect(
				Request.handleMessage({
					command: 'query',
					payload: { query: 'test' },
					requestId: 'test',
				}),
			).toBeUndefined();
		});

		it('should call the resolve function when the request matches the result', () => {
			const resolve = vi.fn();
			// @ts-expect-error _requests is private property
			Request._requests.set('test', resolve);
			expect(
				Request.handleMessage({
					command: 'query',
					payload: {
						query: 'test',
					},
					requestId: 'test',
				}),
			).toBeUndefined();
			expect(resolve).toHaveBeenCalledWith({
				command: 'query',
				payload: {
					query: 'test',
				},
				requestId: 'test',
			});
		});
	});

	describe('.request', () => {
		it('should send a message and return the result', async () => {
			setTimeout(() => {
				Request.handleMessage({
					command: 'query.result',
					payload: {
						success: true,
						data: {
							data: [],
							columns: [],
							command: EQueryCommand.SELECT,
							rowCount: 0,
						},
					},
					requestId: 'test',
				});
			}, 100);
			const result = await Request.request('query', { query: 'test' }, 5000, 'test');
			expect(result).toEqual({
				success: true,
				data: {
					data: [],
					columns: [],
					command: EQueryCommand.SELECT,
					rowCount: 0,
				},
			});
		});

		it('should reject the promise if the request times out', async () => {
			await expect(Request.request('query', { query: 'test' }, 100)).rejects.toThrow('Request timed out');
		});
	});
});
