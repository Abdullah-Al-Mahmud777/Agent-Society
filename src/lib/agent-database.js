/**
 * Internal Database System for Agents
 * Provides CRUD operations, querying, and indexing for agent management
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

class AgentDatabase {
  constructor() {
    this.store = null;
    this.indexes = {
      byId: new Map(),
      byDomain: new Map(),
      byName: new Map(),
      byEnabled: new Map(),
    };
    this.initialize();
  }

  /**
   * Initialize the database with Zustand persistence
   */
  initialize() {
    const storage = createJSONStorage(() => {
      if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
        return {
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
        };
      }
      return window.localStorage;
    });

    this.store = create(
      persist(
        (set, get) => ({
          agents: [],
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
          
          // Initialize from existing store data
          initializeFromStore: (storeAgents) => {
            console.log("Initializing database from store:", storeAgents.length);
            set((state) => ({
              agents: storeAgents,
              metadata: {
                ...state.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }));
            this.rebuildIndexes(storeAgents);
          },
          
          // CRUD Operations
          addAgent: (agent) => {
            set((state) => ({
              agents: [...state.agents, agent],
              metadata: {
                ...state.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }));
            this.rebuildIndexes(get().agents);
            return agent;
          },
          
          updateAgent: (agentId, updates) => {
            set((state) => ({
              agents: state.agents.map((agent) =>
                agent.id === agentId
                  ? { ...agent, ...updates, updatedAt: new Date().toISOString() }
                  : agent
              ),
              metadata: {
                ...state.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }));
            this.rebuildIndexes(get().agents);
            return get().agents.find((a) => a.id === agentId);
          },
          
          deleteAgent: (agentId) => {
            set((state) => ({
              agents: state.agents.filter((agent) => agent.id !== agentId),
              metadata: {
                ...state.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }));
            this.rebuildIndexes(get().agents);
          },
          
          getAgent: (agentId) => {
            return get().agents.find((agent) => agent.id === agentId);
          },
          
          getAllAgents: () => {
            return get().agents;
          },
          
          // Query Operations
          queryByDomain: (domain) => {
            return get().agents.filter((agent) => 
              agent.domain?.toLowerCase() === domain.toLowerCase()
            );
          },
          
          queryByEnabled: (isEnabled = true) => {
            return get().agents.filter((agent) => agent.isEnabled === isEnabled);
          },
          
          queryByName: (name) => {
            return get().agents.filter((agent) =>
              agent.name?.toLowerCase().includes(name.toLowerCase())
            );
          },
          
          queryByCapability: (capability) => {
            return get().agents.filter((agent) =>
              agent.capabilities?.some((cap) =>
                cap.toLowerCase().includes(capability.toLowerCase())
              )
            );
          },
          
          // Advanced Query
          search: (query) => {
            const searchLower = query.toLowerCase();
            return get().agents.filter((agent) => {
              return (
                agent.name?.toLowerCase().includes(searchLower) ||
                agent.domain?.toLowerCase().includes(searchLower) ||
                agent.description?.toLowerCase().includes(searchLower) ||
                agent.expertise?.toLowerCase().includes(searchLower) ||
                agent.capabilities?.some((cap) =>
                  cap.toLowerCase().includes(searchLower)
                )
              );
            });
          },
          
          // Bulk Operations
          bulkAdd: (agents) => {
            set((state) => ({
              agents: [...state.agents, ...agents],
              metadata: {
                ...state.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }));
            this.rebuildIndexes(get().agents);
          },
          
          bulkUpdate: (updates) => {
            set((state) => ({
              agents: state.agents.map((agent) => {
                const update = updates.find((u) => u.id === agent.id);
                return update ? { ...agent, ...update, updatedAt: new Date().toISOString() } : agent;
              }),
              metadata: {
                ...state.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }));
            this.rebuildIndexes(get().agents);
          },
          
          bulkDelete: (agentIds) => {
            set((state) => ({
              agents: state.agents.filter((agent) => !agentIds.includes(agent.id)),
              metadata: {
                ...state.metadata,
                lastUpdated: new Date().toISOString(),
              },
            }));
            this.rebuildIndexes(get().agents);
          },
          
          // Statistics
          getStats: () => {
            const agents = get().agents;
            return {
              total: agents.length,
              enabled: agents.filter((a) => a.isEnabled).length,
              disabled: agents.filter((a) => !a.isEnabled).length,
              byDomain: this.groupByField(agents, 'domain'),
              byModel: this.groupByField(agents, 'model'),
            };
          },
          
          // Reset
          reset: () => {
            set({
              agents: [],
              metadata: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
              },
            });
            this.rebuildIndexes([]);
          },
        }),
        {
          name: 'agent-database',
          storage,
          version: 1,
        }
      )
    );
    
    // Rebuild indexes on load
    this.rebuildIndexes(this.store.getState().agents);
  }

  /**
   * Rebuild all indexes for faster queries
   */
  rebuildIndexes(agents) {
    this.indexes.byId.clear();
    this.indexes.byDomain.clear();
    this.indexes.byName.clear();
    this.indexes.byEnabled.clear();

    agents.forEach((agent) => {
      // Index by ID
      this.indexes.byId.set(agent.id, agent);
      
      // Index by domain
      if (agent.domain) {
        if (!this.indexes.byDomain.has(agent.domain)) {
          this.indexes.byDomain.set(agent.domain, []);
        }
        this.indexes.byDomain.get(agent.domain).push(agent);
      }
      
      // Index by name
      if (agent.name) {
        if (!this.indexes.byName.has(agent.name.toLowerCase())) {
          this.indexes.byName.set(agent.name.toLowerCase(), []);
        }
        this.indexes.byName.get(agent.name.toLowerCase()).push(agent);
      }
      
      // Index by enabled status
      const enabledKey = agent.isEnabled ? 'enabled' : 'disabled';
      if (!this.indexes.byEnabled.has(enabledKey)) {
        this.indexes.byEnabled.set(enabledKey, []);
      }
      this.indexes.byEnabled.get(enabledKey).push(agent);
    });
  }

  /**
   * Helper to group agents by a field
   */
  groupByField(agents, field) {
    return agents.reduce((acc, agent) => {
      const value = agent[field] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  // Public API - CRUD
  add(agent) {
    return this.store.getState().addAgent(agent);
  }

  update(agentId, updates) {
    return this.store.getState().updateAgent(agentId, updates);
  }

  delete(agentId) {
    return this.store.getState().deleteAgent(agentId);
  }

  get(agentId) {
    return this.store.getState().getAgent(agentId);
  }

  getAll() {
    return this.store.getState().getAllAgents();
  }

  // Public API - Queries
  findByDomain(domain) {
    return this.store.getState().queryByDomain(domain);
  }

  findEnabled(isEnabled = true) {
    return this.store.getState().queryByEnabled(isEnabled);
  }

  findByName(name) {
    return this.store.getState().queryByName(name);
  }

  findByCapability(capability) {
    return this.store.getState().queryByCapability(capability);
  }

  search(query) {
    return this.store.getState().search(query);
  }

  // Public API - Bulk Operations
  bulkAdd(agents) {
    return this.store.getState().bulkAdd(agents);
  }

  bulkUpdate(updates) {
    return this.store.getState().bulkUpdate(updates);
  }

  bulkDelete(agentIds) {
    return this.store.getState().bulkDelete(agentIds);
  }

  // Public API - Statistics
  getStats() {
    return this.store.getState().getStats();
  }

  // Public API - Reset
  reset() {
    return this.store.getState().reset();
  }

  // Public API - Subscribe to changes
  subscribe(callback) {
    return this.store.subscribe(callback);
  }

  // Public API - Get current state
  getState() {
    return this.store.getState();
  }

  // Public API - Initialize from existing store data
  initializeFromStore(storeAgents) {
    return this.store.getState().initializeFromStore(storeAgents);
  }
}

// Singleton instance
const agentDatabase = new AgentDatabase();

export default agentDatabase;
export { AgentDatabase };
