import { expect } from 'chai';
import PromiseChain from '../promise-chain';

class C extends PromiseChain<number> {
	private _a: number | undefined;
	private _b: number | undefined;

	public a(a: number): C {
		this._a = a;
		return this;
	}

	public b(b: number): C {
		this._b = b;
		return this;
	}

	protected async execute(): Promise<number> {
		if (this._a === undefined || this._b === undefined) {
			throw new Error('a and b must be defined');
		}
		return this._a + this._b;
	}
}

describe('PromiseChain', () => {
	it('should resolve the promise using async / await', async () => {
		expect(await new C().a(1).b(2)).to.be.equal(3);
	});

	it('should reject the promise using async / await', async () => {
		await expect(new C().a(1)).to.be.rejectedWith('a and b must be defined');
	});

	it('should resolve the promise using then / catch', (done) => {
		new C()
			.a(1)
			.b(2)
			.then((result) => {
				expect(result).to.be.equal(3);
			})
			.finally(done);
	});

	it('should reject the promise using then / catch', (done) => {
		new C()
			.a(1)
			.catch((error) => {
				expect(error.message).to.be.equal('a and b must be defined');
			})
			.finally(done);
	});
});
