import type { VercelRequest as Req } from '@vercel/node'
import type { ServiceAccount } from 'firebase-admin'
import FirebaseAdmin from 'firebase-admin'

/**
 * @file Type Definitions
 * @module lib/types
 */

/**
 * Object representing the data used to generate a custom token.
 */
export type CreateCustomTokenData = {
  developerClaims?: FirebaseCreateCustomTokenParameters['1']
  uid: FirebaseCreateCustomTokenParameters[0]
}

/**
 * Shape of requests accepted by the `/` endpoint.
 */
export interface CreateCustomTokenRequest extends Req {
  headers: CreateCustomTokenRequestHeaders
  body: CreateCustomTokenData[]
}

/**
 * Shape of request headers accepted by the `/` endpoint.
 */
export type CreateCustomTokenRequestHeaders = Req['headers'] & {
  client_email: NonNullable<ServiceAccount['clientEmail']>
  private_key: NonNullable<ServiceAccount['privateKey']>
  project_id: NonNullable<ServiceAccount['projectId']>
}

/**
 * Parameters accepted by the `createCustomToken` method.
 */
export type FirebaseCreateCustomTokenParameters = Parameters<
  ReturnType<typeof FirebaseAdmin['auth']>['createCustomToken']
>

/**
 * Keys required to build a Firebase Admin service account object.
 *
 * **Note**: Type definitions for the Firebase Admin API are incorrect, so using
 * the service account keys specified in the `ServiceAccount` type definition
 * results in the following error: `"Service account object must contain a
 * string \"project_id\" property."`
 */
export type ServiceAccountKey = 'client_email' | 'private_key' | 'project_id'
