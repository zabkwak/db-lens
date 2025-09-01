import { expect } from 'chai';
import sinon from 'sinon';
import * as vscode from 'vscode';
import Password from '../password';
import PromptPasswordProvider from '../prompt-provider';

describe('PromptPasswordProvider', () => {
	describe('.getConfig', () => {
		it('should return set configuration', () => {
			const provider = new PromptPasswordProvider();
			expect(provider.getConfig()).to.be.deep.equal({});
		});
	});

	describe('.getPassword', () => {
		beforeEach(() => {});

		afterEach(() => {
			sinon.restore();
		});

		it('should return the password', async () => {
			(vscode.window.showInputBox as sinon.SinonStub).resolves('test');
			const provider = new PromptPasswordProvider();
			const password = await provider.getPassword();
			expect(password).to.be.an.instanceOf(Password);
			expect(password.password).to.equal('test');
			expect(password.isExpired()).to.be.false;
			// @ts-expect-error _expiresAt is private
			expect(password._expiresAt).to.be.null;
		});

		it('should throw no password error', async () => {
			(vscode.window.showInputBox as sinon.SinonStub).resolves('');
			const provider = new PromptPasswordProvider();
			await expect(provider.getPassword()).to.be.rejectedWith('Password is required');
		});
	});
});
