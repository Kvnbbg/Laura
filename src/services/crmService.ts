import { logger } from '../utils/logger';

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

const CONSTANTS = {
  STORAGE_KEY: 'laura-crm-data',
  ID_SUFFIX_LENGTH: 8,
} as const;

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

type CRMCollectionKey = keyof CRMData;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasRequiredStrings = (values: Array<[string, unknown]>) =>
  values.every(([, value]) => isNonEmptyString(value));

const isCRMData = (value: unknown): value is CRMData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.contacts) &&
    Array.isArray(record.deals) &&
    Array.isArray(record.tasks)
  );
};

const createIdSuffix = () => {
  const rawUuid = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : undefined;
  const normalized = rawUuid ? rawUuid.replace(/-/g, '') : Math.random().toString(36).slice(2);
  return normalized.slice(0, CONSTANTS.ID_SUFFIX_LENGTH);
};

const createId = (prefix: string) => `${prefix}-${createIdSuffix()}`;

const loadData = (): CRMData => {
  try {
    const stored = localStorage.getItem(CONSTANTS.STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(seedData));
      return seedData;
    }

    const parsed = JSON.parse(stored) as unknown;
    if (isCRMData(parsed)) {
      return parsed;
    }

    logger.warn('Invalid CRM data in storage. Resetting to seed data.');
    localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(seedData));
    return seedData;
  } catch (error) {
    logger.error('Failed to load CRM data from storage.', {
      error,
    });
    return seedData;
  }
};

const persist = (data: CRMData) => {
  try {
    localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    logger.error('Failed to persist CRM data.', {
      error,
    });
  }
};

const updateCollection = <T extends { id: string }>(
  data: CRMData,
  key: CRMCollectionKey,
  updater: (items: T[]) => T[]
): CRMData => ({
  ...data,
  [key]: updater(data[key] as T[]),
});

const addItem = <T extends { id: string }>(
  data: CRMData,
  key: CRMCollectionKey,
  item: Omit<T, 'id'>,
  prefix: string
): CRMData =>
  updateCollection<T>(data, key, (items) => [
    ...items,
    { ...item, id: createId(prefix) },
  ]);

const replaceItem = <T extends { id: string }>(
  data: CRMData,
  key: CRMCollectionKey,
  updatedItem: T
): CRMData =>
  updateCollection<T>(data, key, (items) =>
    items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
  );

const removeItem = <T extends { id: string }>(
  data: CRMData,
  key: CRMCollectionKey,
  id: string
): CRMData =>
  updateCollection<T>(data, key, (items) =>
    items.filter((item) => item.id !== id)
  );

export const getCRMData = (): CRMData => loadData();

export const createContact = (contact: Omit<CRMContact, 'id'>) => {
  if (
    !hasRequiredStrings([
      ['name', contact?.name],
      ['company', contact?.company],
      ['email', contact?.email],
      ['segment', contact?.segment],
    ])
  ) {
    logger.warn('Invalid contact payload received. Skipping create.');
    return;
  }

  const data = loadData();
  const updated = addItem<CRMContact>(data, 'contacts', contact, 'contact');
  persist(updated);
};

export const updateContact = (updatedContact: CRMContact) => {
  if (
    !hasRequiredStrings([
      ['id', updatedContact?.id],
      ['name', updatedContact?.name],
      ['company', updatedContact?.company],
      ['email', updatedContact?.email],
      ['segment', updatedContact?.segment],
    ])
  ) {
    logger.warn('Invalid contact update payload received. Skipping update.');
    return;
  }

  const data = loadData();
  const updated = replaceItem<CRMContact>(data, 'contacts', updatedContact);
  persist(updated);
};

export const deleteContact = (id: string) => {
  if (!isNonEmptyString(id)) {
    logger.warn('Invalid contact id received. Skipping delete.');
    return;
  }

  const data = loadData();
  const updated = removeItem<CRMContact>(data, 'contacts', id);
  persist(updated);
};

export const createDeal = (deal: Omit<CRMDeal, 'id'>) => {
  if (
    !hasRequiredStrings([
      ['name', deal?.name],
      ['company', deal?.company],
      ['owner', deal?.owner],
      ['stage', deal?.stage],
    ]) ||
    typeof deal?.value !== 'number'
  ) {
    logger.warn('Invalid deal payload received. Skipping create.');
    return;
  }

  const data = loadData();
  const updated = addItem<CRMDeal>(data, 'deals', deal, 'deal');
  persist(updated);
};

export const updateDeal = (updatedDeal: CRMDeal) => {
  if (
    !hasRequiredStrings([
      ['id', updatedDeal?.id],
      ['name', updatedDeal?.name],
      ['company', updatedDeal?.company],
      ['owner', updatedDeal?.owner],
      ['stage', updatedDeal?.stage],
    ]) ||
    typeof updatedDeal?.value !== 'number'
  ) {
    logger.warn('Invalid deal update payload received. Skipping update.');
    return;
  }

  const data = loadData();
  const updated = replaceItem<CRMDeal>(data, 'deals', updatedDeal);
  persist(updated);
};

export const deleteDeal = (id: string) => {
  if (!isNonEmptyString(id)) {
    logger.warn('Invalid deal id received. Skipping delete.');
    return;
  }

  const data = loadData();
  const updated = removeItem<CRMDeal>(data, 'deals', id);
  persist(updated);
};

export const createTask = (task: Omit<CRMTask, 'id'>) => {
  if (
    !hasRequiredStrings([
      ['title', task?.title],
      ['owner', task?.owner],
      ['dueDate', task?.dueDate],
      ['status', task?.status],
    ])
  ) {
    logger.warn('Invalid task payload received. Skipping create.');
    return;
  }

  const data = loadData();
  const updated = addItem<CRMTask>(data, 'tasks', task, 'task');
  persist(updated);
};

export const updateTask = (updatedTask: CRMTask) => {
  if (
    !hasRequiredStrings([
      ['id', updatedTask?.id],
      ['title', updatedTask?.title],
      ['owner', updatedTask?.owner],
      ['dueDate', updatedTask?.dueDate],
      ['status', updatedTask?.status],
    ])
  ) {
    logger.warn('Invalid task update payload received. Skipping update.');
    return;
  }

  const data = loadData();
  const updated = replaceItem<CRMTask>(data, 'tasks', updatedTask);
  persist(updated);
};

export const deleteTask = (id: string) => {
  if (!isNonEmptyString(id)) {
    logger.warn('Invalid task id received. Skipping delete.');
    return;
  }

  const data = loadData();
  const updated = removeItem<CRMTask>(data, 'tasks', id);
  persist(updated);
};
