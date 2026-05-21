export const statusConfig = {
  pending: { label: 'Pending', color: 'var(--warning)' },
  accepted: { label: 'Accepted', color: 'var(--info)' },
  cooking: { label: 'Cooking', color: 'var(--info)' },
  ready: { label: 'Ready', color: 'var(--success)' },
  served: { label: 'Served', color: 'var(--success)' },
  delivered: { label: 'Delivered', color: 'var(--success)' },
  cancelled: { label: 'Cancelled', color: 'var(--error)' },
  waste: { label: 'Waste', color: 'var(--error)' },
};

export const nextStatuses = {
  pending: ['accepted'],
  accepted: ['cooking'],
  cooking: ['ready'],
  ready: ['served', 'delivered'],
  on_the_way: ['delivered'],
  served: [],
  delivered: [],
  cancelled: [],
  waste: [],
};
