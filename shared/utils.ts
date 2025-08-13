import { IMessagePayload, IPostMessage } from './types';

export const isCommand = <T extends keyof IMessagePayload>(
	message: IPostMessage<keyof IMessagePayload>,
	command: T,
): message is IPostMessage<T> => {
	return message.command === command;
};
