import './StatusPill.scss';

type StatusPillProps = {
  label: string;
  tone: 'success' | 'warning' | 'info' | 'neutral';
};

const StatusPill = ({ label, tone }: StatusPillProps) => {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>;
};

export default StatusPill;
