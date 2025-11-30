import { EQueryCommand } from '../../../shared/types';
import { IMySQLExplainRow } from '../interfaces';

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
		case 'EXPLAIN':
			return EQueryCommand.EXPLAIN;
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

// TODO tests
export function formatMySQLExplain(rows: IMySQLExplainRow[]): string[] {
	rows = [...rows].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

	const lines: string[] = [];
	let indent = 0;

	for (const row of rows) {
		const op = row.select_type ?? 'SIMPLE';
		const table = row.table ?? '<derived>';
		const access = row.type ?? 'ALL';
		const rowsEst = row.rows ?? 0;

		lines.push(`${' '.repeat(indent * 2)}->  ${op} on ${table}  ` + `(access=${access}, rows=${rowsEst})`);

		indent++;

		if (row.key) {
			lines.push(`${' '.repeat(indent * 2)}Key Used: ${row.key} ` + `(len=${row.key_len ?? '?'})`);
		}

		if (row.possible_keys) {
			lines.push(`${' '.repeat(indent * 2)}Possible Keys: ${row.possible_keys}`);
		}

		if (row.ref) {
			lines.push(`${' '.repeat(indent * 2)}Ref: ${row.ref}`);
		}

		if (typeof row.filtered === 'number') {
			lines.push(`${' '.repeat(indent * 2)}Filtered: ${row.filtered.toFixed(2)}%`);
		}

		if (row.Extra) {
			lines.push(`${' '.repeat(indent * 2)}Extra: ${row.Extra}`);
		}
	}

	return lines.filter(Boolean);
}
