import type { VercelRequest as Req, VercelResponse as Res } from '@vercel/node'
import logger from '../lib/logger'

/**
 * @file Handler - API Root
 * @module api
 */

export default ({ body, cookies, query, url }: Req, res: Res): Res => {
  logger('/').debug({ new_request: true, path: url })
  return res.json({ message: 'Hello, World!', req: { body, cookies, query } })
}
