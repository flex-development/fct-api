import HEADERS from 'fixtures/headers'
import HEADERS_EMPTY_STRING from 'fixtures/headers-invalid-empty-string'
import HEADERS_UNDEFINED_VALUE from 'fixtures/headers-invalid-undefined-value'
import createServiceAccount from 'lib/createServiceAccount'
import type { CreateCustomTokenRequestHeaders as Headers } from 'lib/types'

/**
 * @file Unit Tests - createServiceAccount
 * @module tests/specs/createServiceAccount
 */

describe('createServiceAccount', () => {
  it('returns a service account object', () => {
    const res = createServiceAccount(HEADERS)

    Object.keys(res).forEach(key => expect(res[key]).toBe(HEADERS[key]))
  })

  it('throws an error if a key has an empty string value', () => {
    expect(() => createServiceAccount(HEADERS_EMPTY_STRING)).toThrow()
  })

  it('throws an error if a key has an undefined value', () => {
    const headers = HEADERS_UNDEFINED_VALUE as Headers

    expect(() => createServiceAccount(headers)).toThrow()
  })
})
