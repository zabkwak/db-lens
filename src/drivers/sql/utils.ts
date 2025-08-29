import { EQueryCommand } from '../../../shared/types';

const VALID_KEYWORDS = [...Object.values(EQueryCommand), 'with'];

export function getCommand(command: string): EQueryCommand {
	switch (command.toUpperCase()) {
		case 'UPDATE':
			return EQueryCommand.UPDATE;
		case 'INSERT':
			return EQueryCommand.INSERT;
		case 'DELETE':
			return EQueryCommand.DELETE;
		case 'SELECT':
			return EQueryCommand.SELECT;
		default:
			throw new Error(`Unsupported command: ${command}`);
	}
}

export function getCommandFromQuery(query: string): EQueryCommand {
	const queryParts = query.trim().split(' ');
	const command = queryParts.find((part) => VALID_KEYWORDS.includes(part.toLowerCase()));
	if (command?.toLowerCase() === 'with') {
		return getCommandFromQuery(query.replace(/^WITH\s+\w+\s+AS\s+\([\s\S]*?\)\s*/i, '').trim());
	}
	if (!command) {
		throw new Error(`Unsupported query: ${query}`);
	}
	return getCommand(command);
}
