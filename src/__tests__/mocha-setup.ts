import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mockRequire from 'mock-require';
import * as sinon from 'sinon';

chai.use(chaiAsPromised);

mockRequire('vscode', {
	window: {
		createOutputChannel: sinon.stub().returns({
			appendLine: sinon.spy(),
			show: sinon.spy(),
			clear: sinon.spy(),
			dispose: sinon.spy(),
		}),
	},
	// commands: { ... },
	workspace: {
		getConfiguration: sinon.stub().returns({
			get: <T>(): T | undefined => undefined,
		}),
	},
});
