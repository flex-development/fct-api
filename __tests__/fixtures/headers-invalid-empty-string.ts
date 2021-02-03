import type { CreateCustomTokenRequestHeaders } from '../../lib/types'

/**
 * @file Mock Invalid Request Headers - Empty String
 * @module tests/fixtures/headers-invalid-empty-string
 */

const headers: CreateCustomTokenRequestHeaders = {
  client_email: 'client_email',
  private_key: '',
  project_id: 'project_id'
}

export default headers
