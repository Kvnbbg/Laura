export type CRMContact = {
  id: string;
  name: string;
  company: string;
  email: string;
  segment: 'Enterprise' | 'Mid-Market' | 'SMB';
};

export type CRMDeal = {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: 'Prospecting' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won';
  owner: string;
};

export type CRMTask = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Blocked' | 'Done';
};

export type CRMData = {
  contacts: CRMContact[];
  deals: CRMDeal[];
  tasks: CRMTask[];
};

const STORAGE_KEY = 'laura-crm-data';

const seedData: CRMData = {
  contacts: [
    {
      id: 'contact-1',
      name: 'Elena Ruiz',
      company: 'Nebula Health',
      email: 'elena@nebulahealth.io',
      segment: 'Enterprise',
    },
    {
      id: 'contact-2',
      name: 'Marcus Oduro',
      company: 'Orion Labs',
      email: 'marcus@orionlabs.co',
      segment: 'Mid-Market',
    },
  ],
  deals: [
    {
      id: 'deal-1',
      name: 'Campus Analytics Suite',
      company: 'Nebula Health',
      value: 120000,
      stage: 'Proposal',
      owner: 'Ava Chen',
    },
    {
      id: 'deal-2',
      name: 'Student Success Pilot',
      company: 'Orion Labs',
      value: 48000,
      stage: 'Qualified',
      owner: 'Jordan Lee',
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Share proposal deck',
      owner: 'Ava Chen',
      dueDate: '2024-11-05',
      status: 'In Progress',
    },
    {
      id: 'task-2',
      title: 'Schedule stakeholder workshop',
      owner: 'Jordan Lee',
      dueDate: '2024-11-12',
      status: 'Open',
    },
  ],
};

const createId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const loadData = (): CRMData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored) as CRMData;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
  return seedData;
};

const persist = (data: CRMData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getCRMData = (): CRMData => loadData();

export const createContact = (contact: Omit<CRMContact, 'id'>) => {
  const data = loadData();
  const updated = {
    ...data,
    contacts: [...data.contacts, { ...contact, id: createId('contact') }],
  };
  persist(updated);
};

export const updateContact = (updatedContact: CRMContact) => {
  const data = loadData();
  const updated = {
    ...data,
    contacts: data.contacts.map((contact) =>
      contact.id === updatedContact.id ? updatedContact : contact
    ),
  };
  persist(updated);
};

export const deleteContact = (id: string) => {
  const data = loadData();
  const updated = {
    ...data,
    contacts: data.contacts.filter((contact) => contact.id !== id),
  };
  persist(updated);
};

export const createDeal = (deal: Omit<CRMDeal, 'id'>) => {
  const data = loadData();
  const updated = {
    ...data,
    deals: [...data.deals, { ...deal, id: createId('deal') }],
  };
  persist(updated);
};

export const updateDeal = (updatedDeal: CRMDeal) => {
  const data = loadData();
  const updated = {
    ...data,
    deals: data.deals.map((deal) =>
      deal.id === updatedDeal.id ? updatedDeal : deal
    ),
  };
  persist(updated);
};

export const deleteDeal = (id: string) => {
  const data = loadData();
  const updated = {
    ...data,
    deals: data.deals.filter((deal) => deal.id !== id),
  };
  persist(updated);
};

export const createTask = (task: Omit<CRMTask, 'id'>) => {
  const data = loadData();
  const updated = {
    ...data,
    tasks: [...data.tasks, { ...task, id: createId('task') }],
  };
  persist(updated);
};

export const updateTask = (updatedTask: CRMTask) => {
  const data = loadData();
  const updated = {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task
    ),
  };
  persist(updated);
};

export const deleteTask = (id: string) => {
  const data = loadData();
  const updated = {
    ...data,
    tasks: data.tasks.filter((task) => task.id !== id),
  };
  persist(updated);
};
