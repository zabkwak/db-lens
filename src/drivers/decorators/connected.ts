import BaseDriver from '../base';

export default function connected(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
	const { value: originalMethod } = descriptor;
	descriptor.value = function (this: BaseDriver<any, any>, ...args: any[]) {
		if (!this.isConnected()) {
			throw new Error('Database not connected');
		}
		return originalMethod.apply(this, args);
	};
	return descriptor;
}
