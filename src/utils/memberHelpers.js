/**
 * Helper utilities for role-based data filtering (Admin vs. Member / Manager)
 */

/**
 * Extracts unique manager / member names from clients list and events
 */
export const extractAvailableMembers = (clients = [], events = []) => {
  const memberSet = new Set();

  clients.forEach(c => {
    if (c.manager && c.manager.trim()) {
      memberSet.add(c.manager.trim());
    }
  });

  events.forEach(e => {
    if (e.deliveredBy && e.deliveredBy.trim() && e.deliveredBy !== 'Unassigned') {
      memberSet.add(e.deliveredBy.trim());
    }
  });

  return Array.from(memberSet).sort((a, b) => a.localeCompare(b));
};

/**
 * Filter clients based on user role and logged in member
 */
export const getFilteredClients = (clients = [], currentUser = null) => {
  if (!currentUser || currentUser.role === 'admin') {
    return clients;
  }

  const memberName = (currentUser.name || '').trim().toLowerCase();
  return clients.filter(c => (c.manager || '').trim().toLowerCase() === memberName);
};

/**
 * Filter events based on user role and logged in member
 * Member sees events where:
 * 1) The event is assigned/delivered by them (event.deliveredBy === memberName), OR
 * 2) The event belongs to one of their assigned clients (client.manager === memberName)
 */
export const getFilteredEvents = (events = [], clients = [], currentUser = null) => {
  if (!currentUser || currentUser.role === 'admin') {
    return events;
  }

  const memberName = (currentUser.name || '').trim().toLowerCase();
  
  // Find IDs of clients managed by this member
  const memberClientIds = new Set(
    clients
      .filter(c => (c.manager || '').trim().toLowerCase() === memberName)
      .map(c => c.id)
  );

  return events.filter(event => {
    const isDeliveredByMember = (event.deliveredBy || '').trim().toLowerCase() === memberName;
    const isMemberClient = event.client && memberClientIds.has(event.client);
    return isDeliveredByMember || isMemberClient;
  });
};

/**
 * Compute assigned workload metrics for a specific member
 */
export const getMemberAssignedStats = (clients = [], events = [], memberName = '', activeMonth = '') => {
  const normalizedName = (memberName || '').trim().toLowerCase();
  const assignedClients = clients.filter(c => (c.manager || '').trim().toLowerCase() === normalizedName);
  const clientIds = new Set(assignedClients.map(c => c.id));

  const monthEvents = (events || []).filter(e => {
    const isMonth = activeMonth ? e.date && e.date.startsWith(activeMonth) : true;
    if (!isMonth) return false;
    const isDelivered = (e.deliveredBy || '').trim().toLowerCase() === normalizedName;
    const isClientEv = e.client && clientIds.has(e.client);
    return isDelivered || isClientEv;
  });

  const total = monthEvents.length;
  const delivered = monthEvents.filter(e => e.status === 'delivered').length;
  const pending = monthEvents.filter(e => e.status === 'pending').length;
  const inProgress = monthEvents.filter(e => e.status === 'in-progress').length;
  const overdue = monthEvents.filter(e => e.status === 'overdue').length;
  const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return {
    assignedClients,
    totalClients: assignedClients.length,
    monthEvents,
    totalDeliverables: total,
    delivered,
    pending,
    inProgress,
    overdue,
    completionRate
  };
};
