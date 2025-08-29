import { expect } from 'chai';
import { EQueryCommand } from '../../../shared/types';
import { getCommand, getCommandFromQuery } from './utils';

describe('SQL Utils', () => {
	describe('getCommand', () => {
		it('should return select for SELECT command', () => {
			expect(getCommand('SELECT')).to.be.equal(EQueryCommand.SELECT);
		});

		it('should return select for select command', () => {
			expect(getCommand('select')).to.be.equal(EQueryCommand.SELECT);
		});

		it('should return insert for INSERT command', () => {
			expect(getCommand('INSERT')).to.be.equal(EQueryCommand.INSERT);
		});

		it('should return update for UPDATE command', () => {
			expect(getCommand('UPDATE')).to.be.equal(EQueryCommand.UPDATE);
		});

		it('should return delete for DELETE command', () => {
			expect(getCommand('DELETE')).to.be.equal(EQueryCommand.DELETE);
		});

		it('should throw an error for unsupported command', () => {
			expect(() => getCommand('UNSUPPORTED')).to.throw(Error, 'Unsupported command: UNSUPPORTED');
		});
	});

	describe('getCommandFromQuery', () => {
		it('should return select for simple select query', () => {
			expect(getCommandFromQuery('SELECT * FROM users')).to.be.equal(EQueryCommand.SELECT);
		});

		it('should return select for simple select query lowercased', () => {
			expect(getCommandFromQuery('select * from users')).to.be.equal(EQueryCommand.SELECT);
		});

		it('should return insert for insert query', () => {
			expect(getCommandFromQuery('INSERT INTO users (name) VALUES ("John")')).to.be.equal(EQueryCommand.INSERT);
		});

		it('should return delete for delete query', () => {
			expect(getCommandFromQuery('DELETE FROM users WHERE id = 1')).to.be.equal(EQueryCommand.DELETE);
		});

		it('should return update for update query', () => {
			expect(getCommandFromQuery('UPDATE users SET name = "John" WHERE id = 1')).to.be.equal(
				EQueryCommand.UPDATE,
			);
		});

		it('should return select for explain analyze select query', () => {
			expect(getCommandFromQuery('EXPLAIN ANALYZE SELECT * FROM users')).to.be.equal(EQueryCommand.SELECT);
		});

		it('should return insert for query with nested select', () => {
			expect(
				getCommandFromQuery('INSERT INTO users (name) VALUES ((SELECT name FROM admins WHERE id = 1))'),
			).to.be.equal(EQueryCommand.INSERT);
		});

		it('should return select for multiline query', () => {
			expect(
				getCommandFromQuery(`SELECT * FROM users
			WHERE id = 1`),
			).to.be.equal(EQueryCommand.SELECT);
		});

		it('should return insert with WITH query', () => {
			expect(
				getCommandFromQuery(`WITH user_data AS (
					SELECT * FROM users
					WHERE id = 1
				)
				INSERT INTO users (name) SELECT * FROM user_data`),
			).to.be.equal(EQueryCommand.INSERT);
		});

		it('should throw an error for DROP query', () => {
			expect(() => getCommandFromQuery('DROP TABLE users')).to.throw(
				Error,
				'Unsupported query: DROP TABLE users',
			);
		});
	});
});
