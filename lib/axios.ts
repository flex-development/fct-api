import type { FeathersErrorJSON } from '@feathersjs/errors'
import type { AnyObject, ANYTHING } from '@flex-development/json'
import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import isPlainObject from 'lodash/isPlainObject'
import createError from './createError'

/**
 * @file Axios Configuration
 * @module axios
 * @see {@link https://github.com/axios/axios}
 */

/**
 * Transforms an Axios error into a Feathers Error.
 *
 * @param error - Error to transform
 * @throws {FeathersErrorJSON}
 */
const handleErrorResponse = (error: AxiosError): void => {
  const { config = {}, message, request, response, stack } = error

  let feathersError = {} as FeathersErrorJSON

  if (response) {
    // The request was made and the server responded with a status code
    const { data, status } = response as AxiosResponse<AnyObject>
    const err = data as FeathersErrorJSON
    const { className } = err as FeathersErrorJSON

    feathersError = className ? err : createError(message, data, status)
  } else if (request) {
    // The request was made but no response was received
    feathersError = createError('No response received.')
  } else {
    // Something happened in setting up the request that triggered an error
    feathersError = createError(message, { errors: { stack } })
  }

  if (isPlainObject(feathersError.data)) feathersError.data.config = config

  throw feathersError
}

/**
 * Returns the data from a successful request.
 *
 * @param response - Success response
 * @throws {FeathersError}
 */
const handleSuccessResponse = (res: AxiosResponse): ANYTHING => {
  return res?.data ?? res
}

axios.interceptors.response.use(handleSuccessResponse, handleErrorResponse)

export default axios
