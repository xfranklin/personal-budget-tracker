import { services } from './master.service'

/**
 * Composable function to access the single, shared Master Service instance
 * inside Vue components.
 *
 * @returns The singleton MasterService instance.
 */
export function useServices() {
  return services
}
