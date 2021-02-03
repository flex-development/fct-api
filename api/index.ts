import type { AnyObject } from '@flex-development/json'
import type { VercelResponse as Res } from '@vercel/node'
import firebase from 'firebase-admin'
import type { PageViewParam } from 'ga-measurement-protocol'
import isEmpty from 'lodash/isEmpty'
import pick from 'lodash/pick'
import { createError, createLogger, createServiceAccount, ga } from '../lib'
import type {
  CreateCustomTokenRequest as Req,
  CreateCustomTokenResult as Result
} from '../lib/types'

/**
 * @file Handler - Custom Token Generator
 * @module api
 */

const {
  VERCEL_ENV: env = '',
  VERCEL_GIT_COMMIT_REF: branch = '',
  VERCEL_GIT_COMMIT_SHA: commit = ''
} = process.env

/**
 * Generates a custom token.
 *
 * By default, Firebase Admin will **not** throw an error if the user with the
 * UID to generate a custom token for does not exist.
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

  // Get page path without query
  const documentPath = url.split('?')[0]

  // Create pageview params object
  const pageview_params: PageViewParam = {
    documentHost: req.headers?.host ?? 'unknown',
    documentPath,
    documentTitle: 'Create Custom Token'
  }

  // Attach additional pageview params in Vercel environment
  if (!isEmpty(branch)) pageview_params.branch = branch
  if (!isEmpty(commit)) pageview_params.commit = commit
  if (!isEmpty(env)) pageview_params.env = env

  // Track endpoint view
  await ga.pageview(pageview_params)

  // Initialize logger
  const Logger = createLogger(documentPath)

  // Only handle `POST` requests
  if (method !== 'POST') return res.json([])

  try {
    // Build service account object
    const service_account = createServiceAccount(headers)

    // Create Firebase Admin credential
    const credential = firebase.credential.cert(service_account)

    // Set identifier for API user using Firebase project ID
    ga.setUserId(req.headers.project_id)

    // Initialize Firebase Admin
    const admin = ((): firebase.app.App => {
      if (firebase.apps.length > 0) return firebase.app()
      return firebase.initializeApp({ credential })
    })()

    // Get Authentication client
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

    // Track success response
    await ga.event({
      eventAction: 'create',
      eventCategory: 'API',
      eventLabel: 'Custom Token',
      eventValue: tokens.length
    })

    // Return custom tokens
    return res.json(tokens)
  } catch (err) {
    let error: AnyObject = {}

    if (err.codePrefix) {
      // Handle Firebase error
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
        errors: pick(errorInfo, ['code', 'developerClaims', 'uid'])
      }

      error = createError(err.message, data, status)
    } else {
      // Handle other errors
      error = createError(err.message, {})
    }

    // Attach additional error arguments
    error.data.req = { body, query }

    // Attach additional arguments in Vercel environment
    if (!isEmpty(branch)) error.data.branch = branch
    if (!isEmpty(commit)) error.data.commit = commit
    if (!isEmpty(env)) error.data.env = env

    // Track exceptions
    await ga.exception({
      ...error,
      exceptionDescription: error.message,
      isExceptionFatal: 0
    })

    // Log and return error
    Logger.error({ error })
    return res.status(error.code).json(error)
  }
}
