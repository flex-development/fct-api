import type { ServiceAccountKey } from './types'

/**
 * @file Constant Values
 * @module lib/constants
 */

/**
 * Array of keys required to build a Firebase Admin service account object.
 */
export const SERVICE_ACCOUNT_KEYS: ServiceAccountKey[] = [
  'client_email',
  'private_key',
  'project_id'
]
