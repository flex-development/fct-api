import type { FeathersErrorJSON } from '@feathersjs/errors'
import type { VercelResponse as Res } from '@vercel/node'
import firebase from 'firebase-admin'
import { pick } from 'lodash'
import { createError, createLogger, createServiceAccount } from '../lib'
import type {
  CreateCustomTokenRequest as Req,
  CreateCustomTokenResult as Result
} from '../lib/types'

/**
 * @file Handler - Custom Token Generator
 * @module api
 */

/**
 * Generates a custom token.
 *
 * By default, Firebase Admin will **not** throw an error if the user with the
 * UID to create claims for does not exist.
 *
 * If {@param req.query.user_must_exist}, this endpoint will return an error if
 * such conditions are met.
 *
 * @param req - API request object
 * @param req.body - Array of custom token creation data objects
 * @param req.headers - Request headers containing service account data
 * @param req.headers.client_email - Firebase client email
 * @param req.headers.private_key - Firebase private key
 * @param req.headers.project_id - Firebase project ID
 * @param req.method - Request method
 * @param req.query - Request query parameters
 * @param req.query.user_must_exist - If true, check if user exists before
 * creating custom token
 * @param req.url - Request path
 * @param res - API response object
 */
export default async (req: Req, res: Res): Promise<Res> => {
  const { body = [], headers, method, query, url = '/' } = req
  query.user_must_exist = JSON.parse(`${query?.user_must_exist ?? true}`)

  // Initialize logger
  const Logger = createLogger(url.split('?')[0])

  // Only handle `POST` requests
  if (method !== 'POST') return res.json([])

  try {
    // Build service account object
    const service_account = createServiceAccount(headers)

    // Create Firebase Admin credential
    const credential = firebase.credential.cert(service_account)

    // Initialize Firebase Admin and get Authentication client
    const admin = firebase.initializeApp({ credential })
    const auth = admin.auth()

    // Batch create custom tokens
    const batch: Promise<Result | undefined>[] = body.map(async data => {
      const { developerClaims, uid } = data

      // Parse UID
      const $uid = `${uid || ''}`.trim()

      // If missing UID, do nothing
      if (!$uid || !$uid.length) return

      // If true, check if user exists before creating custom token
      if (query.user_must_exist) {
        try {
          await auth.getUser($uid)
        } catch (error) {
          error.errorInfo.developerClaims = developerClaims
          error.errorInfo.uid = uid

          throw error
        }
      }

      // Create custom token
      const token = await auth.createCustomToken($uid, developerClaims)

      return { developerClaims, token, uid: $uid }
    })

    // Complete batch create custom tokens promise
    const tokens = (await Promise.all(batch)) || []

    // Return custom tokens
    return res.json(tokens)
  } catch (err) {
    let error = {} as FeathersErrorJSON

    if (err.codePrefix) {
      const { codePrefix, errorInfo } = err

      let status = 500

      switch (errorInfo.code) {
        case 'app/invalid-credential':
          status = 401
          break
        case 'auth/user-not-found':
          status = 404
          break
        default:
          break
      }

      const data = {
        codePrefix,
        errors: pick(errorInfo, ['code', 'developerClaims', 'uid']),
        req: { body, query }
      }

      error = createError(err.message, data, status)
    } else {
      error = createError(err.message, { req: { body, query } })
    }

    Logger.error({ error })
    return res.status(error.code).json(error)
  }
}
