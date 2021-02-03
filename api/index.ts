import type { FeathersErrorJSON } from '@feathersjs/errors'
import type { VercelResponse as Res } from '@vercel/node'
import firebase from 'firebase-admin'
import { createError, createLogger, createServiceAccount } from '../lib'
import type { CreateCustomTokenRequest as Req } from '../lib/types'

/**
 * @file Handler - Custom Token Generator
 * @module api
 */

// Initialize serverless function logger
const Logger = createLogger('/create')

/**
 * Generates a custom token.
 *
 * @param req - API request object
 * @param res - API response object
 */
export default (req: Req, res: Res): Res => {
  const { body, headers, method, url } = req

  // Only handle `POST` requests
  if (method !== 'POST') return res.json([])

  // Log new incoming request
  Logger.debug({ new_request: true, path: url })

  // Build service account object
  const service_account = createServiceAccount(headers)

  try {
    // Create Firebase Admin credential
    const credential = firebase.credential.cert(service_account)

    // Initialize Firebase Admin client
    const admin = firebase.initializeApp({ credential })

    return res.json({})
  } catch (err) {
    // Initialize return error object
    let error = {} as FeathersErrorJSON

    // Handle Firebase errors
    if (!err.className) {
      const { code, message } = err
      const status = code === 'app/invalid-credential' ? 401 : 500

      error = createError(message, { code, message, service_account }, status)
    }

    // Log and return error
    Logger.debug({ error })
    return res.status(error.code).json(error)
  }
}
