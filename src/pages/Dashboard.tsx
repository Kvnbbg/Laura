import { useMemo, useState } from 'react';
import SectionHeader from '../components/crm/SectionHeader';
import StatCard from '../components/crm/StatCard';
import StatusPill from '../components/crm/StatusPill';
import {
  CRMContact,
  CRMDeal,
  CRMTask,
  createContact,
  createDeal,
  createTask,
  deleteContact,
  deleteDeal,
  deleteTask,
  getCRMData,
  updateDeal,
  updateTask,
} from '../services/crmService';
import './Dashboard.scss';

const stages: CRMDeal['stage'][] = [
  'Prospecting',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
];

const taskStatuses: CRMTask['status'][] = [
  'Open',
  'In Progress',
  'Blocked',
  'Done',
];

const Dashboard = () => {
  const [data, setData] = useState(getCRMData());
  const [contactForm, setContactForm] = useState<Omit<CRMContact, 'id'>>({
    name: '',
    company: '',
    email: '',
    segment: 'SMB',
  });
  const [dealForm, setDealForm] = useState<Omit<CRMDeal, 'id'>>({
    name: '',
    company: '',
    value: 0,
    stage: 'Prospecting',
    owner: '',
  });
  const [taskForm, setTaskForm] = useState<Omit<CRMTask, 'id'>>({
    title: '',
    owner: '',
    dueDate: '',
    status: 'Open',
  });

  const refreshData = () => setData(getCRMData());

  const metrics = useMemo(() => {
    const activeDeals = data.deals.filter((deal) => deal.stage !== 'Closed Won');
    const totalPipeline = data.deals.reduce((sum, deal) => sum + deal.value, 0);
    const winRate = data.deals.length
      ? Math.round(
          (data.deals.filter((deal) => deal.stage === 'Closed Won').length /
            data.deals.length) *
            100
        )
      : 0;
    const tasksDue = data.tasks.filter((task) => task.status !== 'Done').length;

    return {
      totalPipeline,
      activeDeals: activeDeals.length,
      winRate,
      tasksDue,
    };
  }, [data.deals, data.tasks]);

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contactForm.name || !contactForm.email) {
      return;
    }
    createContact(contactForm);
    setContactForm({ name: '', company: '', email: '', segment: 'SMB' });
    refreshData();
  };

  const handleDealSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dealForm.name || !dealForm.company) {
      return;
    }
    createDeal({ ...dealForm, value: Number(dealForm.value) || 0 });
    setDealForm({
      name: '',
      company: '',
      value: 0,
      stage: 'Prospecting',
      owner: '',
    });
    refreshData();
  };

  const handleTaskSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskForm.title || !taskForm.owner) {
      return;
    }
    createTask(taskForm);
    setTaskForm({ title: '', owner: '', dueDate: '', status: 'Open' });
    refreshData();
  };

  const stageTone = (stage: CRMDeal['stage']) => {
    if (stage === 'Closed Won') {
      return 'success';
    }
    if (stage === 'Negotiation') {
      return 'warning';
    }
    if (stage === 'Qualified' || stage === 'Proposal') {
      return 'info';
    }
    return 'neutral';
  };

  const taskTone = (status: CRMTask['status']) => {
    if (status === 'Done') {
      return 'success';
    }
    if (status === 'Blocked') {
      return 'warning';
    }
    if (status === 'In Progress') {
      return 'info';
    }
    return 'neutral';
  };

  return (
    <div className="dashboard">
      <div className="container">
        <section className="dashboard-hero">
          <h1>CRM Command Center</h1>
          <p className="text-secondary">
            A unified workspace to manage contacts, revenue pipelines, and
            mission-critical tasks with clarity.
          </p>
        </section>

        <section className="dashboard-metrics">
          <div className="grid grid-4">
            <StatCard
              label="Pipeline Value"
              value={`$${metrics.totalPipeline.toLocaleString()}`}
              trend="+12% vs last cycle"
              accent="purple"
            />
            <StatCard
              label="Active Deals"
              value={String(metrics.activeDeals)}
              trend="8 high-priority opportunities"
              accent="cyan"
            />
            <StatCard
              label="Win Rate"
              value={`${metrics.winRate}%`}
              trend="Stable in last 30 days"
              accent="gold"
            />
            <StatCard
              label="Tasks Due"
              value={String(metrics.tasksDue)}
              trend="3 require today"
              accent="purple"
            />
          </div>
        </section>

        <section className="dashboard-section">
          <SectionHeader
            title="Accounts & Contacts"
            subtitle="Keep team ownership, segmentation, and outreach context in one view."
          />
          <div className="dashboard-split">
            <div className="card">
              <h3>Add new contact</h3>
              <form className="crm-form" onSubmit={handleContactSubmit}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={contactForm.name}
                  onChange={(event) =>
                    setContactForm({ ...contactForm, name: event.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={contactForm.company}
                  onChange={(event) =>
                    setContactForm({
                      ...contactForm,
                      company: event.target.value,
                    })
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={(event) =>
                    setContactForm({ ...contactForm, email: event.target.value })
                  }
                />
                <select
                  value={contactForm.segment}
                  onChange={(event) =>
                    setContactForm({
                      ...contactForm,
                      segment: event.target.value as CRMContact['segment'],
                    })
                  }
                >
                  <option value="SMB">SMB</option>
                  <option value="Mid-Market">Mid-Market</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
                <button type="submit" className="btn btn-primary">
                  Save contact
                </button>
              </form>
            </div>
            <div className="card">
              <h3>Key contacts</h3>
              <div className="crm-list">
                {data.contacts.map((contact) => (
                  <div key={contact.id} className="crm-list-item">
                    <div>
                      <p className="crm-title">{contact.name}</p>
                      <p className="text-secondary">
                        {contact.company} · {contact.email}
                      </p>
                    </div>
                    <div className="crm-actions">
                      <StatusPill
                        label={contact.segment}
                        tone={contact.segment === 'Enterprise' ? 'info' : 'neutral'}
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          deleteContact(contact.id);
                          refreshData();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <SectionHeader
            title="Revenue Pipeline"
            subtitle="Monitor deal velocity, update stages, and keep revenue forecasts accurate."
          />
          <div className="dashboard-split">
            <div className="card">
              <h3>Create new deal</h3>
              <form className="crm-form" onSubmit={handleDealSubmit}>
                <input
                  type="text"
                  placeholder="Deal name"
                  value={dealForm.name}
                  onChange={(event) =>
                    setDealForm({ ...dealForm, name: event.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={dealForm.company}
                  onChange={(event) =>
                    setDealForm({ ...dealForm, company: event.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Value"
                  value={dealForm.value}
                  onChange={(event) =>
                    setDealForm({
                      ...dealForm,
                      value: Number(event.target.value),
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Owner"
                  value={dealForm.owner}
                  onChange={(event) =>
                    setDealForm({ ...dealForm, owner: event.target.value })
                  }
                />
                <select
                  value={dealForm.stage}
                  onChange={(event) =>
                    setDealForm({
                      ...dealForm,
                      stage: event.target.value as CRMDeal['stage'],
                    })
                  }
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">
                  Add deal
                </button>
              </form>
            </div>
            <div className="card">
              <h3>Live pipeline</h3>
              <div className="crm-list">
                {data.deals.map((deal) => (
                  <div key={deal.id} className="crm-list-item">
                    <div>
                      <p className="crm-title">{deal.name}</p>
                      <p className="text-secondary">
                        {deal.company} · ${deal.value.toLocaleString()} · Owner
                        {` ${deal.owner || 'Unassigned'}`}
                      </p>
                    </div>
                    <div className="crm-actions">
                      <select
                        className="crm-select"
                        value={deal.stage}
                        onChange={(event) => {
                          updateDeal({
                            ...deal,
                            stage: event.target.value as CRMDeal['stage'],
                          });
                          refreshData();
                        }}
                      >
                        {stages.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                      <StatusPill label={deal.stage} tone={stageTone(deal.stage)} />
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          deleteDeal(deal.id);
                          refreshData();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <SectionHeader
            title="Execution Board"
            subtitle="Stay ahead of delivery, customer success, and follow-up actions."
          />
          <div className="dashboard-split">
            <div className="card">
              <h3>Create task</h3>
              <form className="crm-form" onSubmit={handleTaskSubmit}>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, title: event.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Owner"
                  value={taskForm.owner}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, owner: event.target.value })
                  }
                />
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, dueDate: event.target.value })
                  }
                />
                <select
                  value={taskForm.status}
                  onChange={(event) =>
                    setTaskForm({
                      ...taskForm,
                      status: event.target.value as CRMTask['status'],
                    })
                  }
                >
                  {taskStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">
                  Add task
                </button>
              </form>
            </div>
            <div className="card">
              <h3>Active tasks</h3>
              <div className="crm-list">
                {data.tasks.map((task) => (
                  <div key={task.id} className="crm-list-item">
                    <div>
                      <p className="crm-title">{task.title}</p>
                      <p className="text-secondary">
                        {task.owner} · Due {task.dueDate || 'TBD'}
                      </p>
                    </div>
                    <div className="crm-actions">
                      <select
                        className="crm-select"
                        value={task.status}
                        onChange={(event) => {
                          updateTask({
                            ...task,
                            status: event.target.value as CRMTask['status'],
                          });
                          refreshData();
                        }}
                      >
                        {taskStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <StatusPill label={task.status} tone={taskTone(task.status)} />
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          deleteTask(task.id);
                          refreshData();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
