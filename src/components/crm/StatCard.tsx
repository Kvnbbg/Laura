import './StatCard.scss';

type StatCardProps = {
  label: string;
  value: string;
  trend?: string;
  accent?: 'purple' | 'cyan' | 'gold';
};

const StatCard = ({ label, value, trend, accent = 'purple' }: StatCardProps) => {
  return (
    <div className={`card stat-card stat-card--${accent}`}>
      <p className="stat-label text-secondary">{label}</p>
      <h3 className="stat-value">{value}</h3>
      {trend ? <p className="stat-trend">{trend}</p> : null}
    </div>
  );
};

export default StatCard;
