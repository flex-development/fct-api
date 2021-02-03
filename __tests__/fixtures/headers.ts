import type { CreateCustomTokenRequestHeaders } from '../../lib/types'

/**
 * @file Mock Request Headers
 * @module tests/fixtures/headers
 */

const headers: CreateCustomTokenRequestHeaders = {
  client_email: 'client_email',
  private_key: 'private_key',
  project_id: 'project_id'
}

export default headers
