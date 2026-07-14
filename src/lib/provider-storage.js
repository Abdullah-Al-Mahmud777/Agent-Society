/**
 * Provider Storage Service
 * 
 * Local storage implementation for user provider configurations
 * For production: Replace with proper database (PostgreSQL, MongoDB, etc.)
 */

import { createUserProvider, userProviderSchema, PROVIDERS } from "./db-schema";

const STORAGE_KEY = "user_providers";

/**
 * Get all user providers from storage
 */
export function getAllProviders() {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const providers = JSON.parse(stored);
    // Filter out legacy providers (like Gemini) that are no longer supported
    const validProviders = providers.filter(p => 
      Object.values(PROVIDERS).includes(p.providerName)
    );
    // Update storage if we removed any invalid providers
    if (validProviders.length !== providers.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validProviders));
    }
    return validProviders.map(p => userProviderSchema.parse(p));
  } catch (error) {
    console.error("Error reading providers:", error);
    return [];
  }
}

/**
 * Get a specific provider by ID
 */
export function getProviderById(id) {
  const providers = getAllProviders();
  return providers.find(p => p.id === id);
}

/**
 * Get active provider for a user
 * If no userId provided, returns the first active provider (for single-user apps)
 */
export function getActiveProvider(userId = "default-user") {
  const providers = getAllProviders();
  
  // If userId provided, find exact match
  if (userId) {
    return providers.find(p => p.userId === userId && p.isActive);
  }
  
  // Otherwise return any active provider (for single-user demo apps)
  return providers.find(p => p.isActive);
}

/**
 * Save a new provider configuration
 */
export function saveProvider(providerData) {
  if (typeof window === "undefined") {
    throw new Error("Cannot save provider on server side");
  }
  
  try {
    const providers = getAllProviders();
    const newProvider = createUserProvider(providerData);
    
    // Deactivate other providers for this user if this one is active
    if (newProvider.isActive) {
      providers.forEach(p => {
        if (p.userId === newProvider.userId) {
          p.isActive = false;
        }
      });
    }
    
    providers.push(newProvider);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    
    return newProvider;
  } catch (error) {
    console.error("Error saving provider:", error);
    throw new Error("Failed to save provider configuration");
  }
}

/**
 * Update an existing provider
 */
export function updateProvider(id, updates) {
  if (typeof window === "undefined") {
    throw new Error("Cannot update provider on server side");
  }
  
  try {
    const providers = getAllProviders();
    const index = providers.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error("Provider not found");
    }
    
    const updated = {
      ...providers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Validate updated data
    const validated = userProviderSchema.parse(updated);
    
    // Deactivate other providers if this one is being activated
    if (validated.isActive) {
      providers.forEach((p, i) => {
        if (i !== index && p.userId === validated.userId) {
          p.isActive = false;
        }
      });
    }
    
    providers[index] = validated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    
    return validated;
  } catch (error) {
    console.error("Error updating provider:", error);
    throw new Error("Failed to update provider configuration");
  }
}

/**
 * Delete a provider
 */
export function deleteProvider(id) {
  if (typeof window === "undefined") {
    throw new Error("Cannot delete provider on server side");
  }
  
  try {
    const providers = getAllProviders();
    const filtered = providers.filter(p => p.id !== id);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting provider:", error);
    throw new Error("Failed to delete provider configuration");
  }
}

/**
 * Set a provider as active
 */
export function setActiveProvider(id) {
  const provider = getProviderById(id);
  if (!provider) {
    throw new Error("Provider not found");
  }
  
  return updateProvider(id, { isActive: true });
}

/**
 * Clear all providers (for testing/development)
 */
export function clearAllProviders() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
