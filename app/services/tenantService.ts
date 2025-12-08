import { Tenant } from "@/lib/types";

const API_BASE_URL = "/api";

/**
 * Creates a new tenant.
 * @param payload The data for the new tenant.
 * @returns A promise that resolves to the created tenant.
 */
export const createTenant = async (payload: Omit<Tenant, 'TenantID'>): Promise<Tenant> => {
  const res = await fetch(`${API_BASE_URL}/Tenant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error ?? "Failed to create tenant");
  }
  return res.json();
};

/**
 * Deletes a tenant. Used for rolling back a failed contract creation.
 * @param tenantId The ID of the tenant to delete.
 */
export const deleteTenant = async (tenantId: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/Tenant?id=${tenantId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    // We can choose to not throw an error here, as it's a cleanup operation
    console.error(`Failed to rollback/delete tenant with ID: ${tenantId}`);
  }
};