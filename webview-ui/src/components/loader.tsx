import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';
import './loader.scss';

interface IProps {
	size?: 'small' | 'medium' | 'large';
}

const Loader: React.FC<IProps> = ({ size = 'small' }) => {
	return (
		<div className="loading-indicator">
			<VSCodeProgressRing className={`ring ${size}`} />
		</div>
	);
};

export default Loader;
