import { VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow } from '@vscode/webview-ui-toolkit/react';
import { JSX, useEffect, useState } from 'react';
import { IColumn } from '../../../shared/types';
import FormControl from './form-control';
import Loader from './loader';
import './table.scss';

interface IProps<T extends object> {
	data: T[];
	columns: IColumn[];
	loading?: boolean;
}

function getValue(value: any): string {
	if (value === undefined) {
		return '';
	}
	if (value === null) {
		return 'null';
	}
	if (typeof value === 'object') {
		return JSON.stringify(value);
	}
	return value.toString();
}

const MIN_EM = 7;
const MAX_EM = 50;
const EM_COEFFICIENT = 1;

export default function Table<T extends object>(props: IProps<T>): JSX.Element {
	const [columnLayout, setColumnLayout] = useState<string>('');
	const [wrap, setWrap] = useState(false);
	useEffect(() => {
		const data = props.data.reduce((acc, row) => {
			props.columns.forEach((column, index) => {
				const columnName = column.name.toLowerCase();
				// @ts-expect-error unknown type
				const value = getValue(row[columnName]);
				if (acc[index] == null) {
					acc[index] = Math.max(value.length, columnName.length);
				} else {
					acc[index] = Math.max(acc[index], value.length, columnName.length);
				}
			});
			return acc;
		}, [] as number[]);
		setColumnLayout(
			data.map((value) => `${Math.min(Math.max(value * EM_COEFFICIENT, MIN_EM), MAX_EM)}em`).join(' '),
		);
	}, [props.data, props.columns]);
	return (
		<div className="table-container">
			<div className="table-header">
				<FormControl type="checkbox" value={wrap} label="Wrap lines" onChange={setWrap} labelPosition="left" />
			</div>
			{props.loading ? (
				<Loader />
			) : (
				<div className="table-data">
					<VSCodeDataGrid
						aria-label="Data Grid"
						className="data-grid"
						gridTemplateColumns={wrap ? undefined : columnLayout}
					>
						<VSCodeDataGridRow row-type="header">
							{props.columns.map((column, index) => (
								<VSCodeDataGridCell key={index} cell-type="columnheader" grid-column={`${index + 1}`}>
									{column.name}
								</VSCodeDataGridCell>
							))}
						</VSCodeDataGridRow>
						{props.data.map((row, index) => (
							<VSCodeDataGridRow key={index}>
								{props.columns.map((column, colIndex) => (
									<VSCodeDataGridCell key={colIndex} grid-column={`${colIndex + 1}`}>
										{/* @ts-expect-error unknown type */}
										{getValue(row[column.name.toLowerCase()])}
									</VSCodeDataGridCell>
								))}
							</VSCodeDataGridRow>
						))}
					</VSCodeDataGrid>
				</div>
			)}
		</div>
	);
}
