import './SectionHeader.scss';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => {
  return (
    <div className="crm-section-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p className="text-secondary">{subtitle}</p> : null}
      </div>
      {action ? <div className="crm-section-action">{action}</div> : null}
    </div>
  );
};

export default SectionHeader;
