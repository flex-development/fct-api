import type { ServiceAccount } from 'firebase-admin'
import isEmpty from 'lodash/isEmpty'
import pick from 'lodash/pick'
import { SERVICE_ACCOUNT_KEYS as SAK } from './constants'
import createError from './createError'
import type { CreateCustomTokenRequestHeaders as Headers } from './types'

/**
 * @file Implementation - createServiceAccount
 * @module lib/createServiceAccount
 */

/**
 * Creates a Firebase Admin service account object.
 *
 * The required keys can be found by generating a private key file from the
 * Firebase Console:
 *
 * 1. Open **Settings > Service Accounts**
 * 2. Click **Generate New Private Key**; confirm by clicking **Generate Key**
 * 3. Securely store the JSON file containing the key
 *
 * If any keys are missing or an empty string, the function will throw an error.
 *
 * @param headers - API request headers containing service account data
 * @param headers.client_email - Firebase client email
 * @param headers.private_key - Firebase private key
 * @param headers.project_id - Firebase project ID
 * @throws {FeathersErrorJSON}
 */
const createServiceAccount = (headers: Headers): ServiceAccount => {
  // Pick service account keys from request `headers` object
  const data = pick(headers, SAK) as Record<string, string | undefined>

  // Check if any keys are missing or an empty string
  SAK.forEach(key => {
    const value = (data[key] || '').trim()

    if (isEmpty(value)) {
      const error_data = { data: { headers: data }, errors: { [key]: value } }
      throw createError(`Missing ${key}.`, error_data, 401)
    }
  })

  // Get service account data from validated request headers
  const { client_email = '', private_key = '', project_id = '' } = data

  /**
   * NOTICE:
   *
   * - Firebase Admin API types are incorrect, so type cast is required.
   * - Regex replacement fixes `Failed to parse private key: Error: Invalid PEM
   *   formatted message.`
   */
  return {
    client_email,
    private_key: private_key?.replace(/\\n/g, '\n'),
    project_id
  } as ServiceAccount
}

export default createServiceAccount
