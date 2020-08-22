import { captureException } from '@sentry/react-native'
import { revokePreviousSource } from '@actions/sleep-source-actions/revoke-previous-source'
import { setMainSource } from '@actions/sleep-source-actions/sleep-source-actions'
import { formatSleepData } from '@actions/sleep/sleep-data-actions'
import CONFIG from 'config/Config'
import { formatWithingsSamples } from 'helpers/sleep/withings-helper'
import moment from 'moment'
import {
  authorize,
  AuthorizeResult,
  refresh,
  RefreshResult
} from 'react-native-app-auth'
import ReduxAction, { Dispatch, Thunk } from 'Types/ReduxActions'
import { SOURCE } from 'typings/state/sleep-source-state'
import {
  getWithingsEnabled,
  getWithingsToken
} from '../../store/Selectors/api-selectors/api-selectors'
import { GetState } from '../../Types/GetState'

export const WITHINGS_AUTHORIZE_SUCCESS = 'WITHINGS_AUTHORIZE_SUCCESS'
export const WITHINGS_REVOKE_SUCCESS = 'WITHINGS_REVOKE_SUCCESS'
export const WITHINGS_UPDATE_TOKEN = 'WITHINGS_UPDATE_TOKEN'

export const FETCH_SLEEP_WITHINGS_START = 'FETCH_SLEEP_WITHINGS_START'
export const FETCH_SLEEP_WITHINGS_SUCCESS = 'FETCH_SLEEP_WITHINGS_SUCCESS'
export const FETCH_SLEEP_WITHINGS_FAILURE = 'FETCH_SLEEP_WITHINGS_FAILURE'

export const withingsAuthorizeSuccess = (
  payload: WithingAuthResponse
): ReduxAction => ({
  type: WITHINGS_AUTHORIZE_SUCCESS,
  payload
})

export const withingsRevokeSuccess = (): ReduxAction => ({
  type: WITHINGS_REVOKE_SUCCESS
})

export const withingsUpdateToken = (
  payload: WithingAuthResponse
): ReduxAction => ({
  type: WITHINGS_UPDATE_TOKEN,
  payload
})

export const fetchSleepWithingsStart = (): ReduxAction => ({
  type: FETCH_SLEEP_WITHINGS_START
})

export const fetchSleepWithingsSuccess = (): ReduxAction => ({
  type: FETCH_SLEEP_WITHINGS_SUCCESS
})

export const fetchSleepWithingsFailure = (): ReduxAction => ({
  type: FETCH_SLEEP_WITHINGS_FAILURE
})

export const toggleWithings = (): Thunk => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const enabled = getWithingsEnabled(getState())
  if (enabled) {
    dispatch(revokeWithingsAccess())
  } else {
    await dispatch(revokePreviousSource())

    await dispatch(authorizeWithings())
  }
}

export const authorizeWithings = (): Thunk => async (dispatch: Dispatch) => {
  try {
    const response = (await authorize(
      CONFIG.WITHINGS_CONFIG
    )) as WithingsAuthorizeResult

    const {
      accessTokenExpirationDate,
      refreshToken,
      accessToken,
      tokenAdditionalParameters: { userid: user_id }
    } = response

    dispatch(
      withingsAuthorizeSuccess({
        accessTokenExpirationDate,
        refreshToken,
        accessToken,
        user_id,
        enabled: true
      })
    )
    dispatch(setMainSource(SOURCE.WITHINGS))
  } catch (error) {
    captureException(error)
  }
}

export const refreshWithingsToken = (): Thunk => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const { refreshToken: oldToken } = getWithingsToken(getState())

  if (oldToken) {
    try {
      const response = (await refresh(CONFIG.WITHINGS_CONFIG, {
        refreshToken: oldToken
      })) as WithingsRefreshResult

      const {
        accessTokenExpirationDate,
        refreshToken,
        accessToken,
        additionalParameters: { userid: user_id }
      } = response

      dispatch(
        withingsAuthorizeSuccess({
          accessTokenExpirationDate,
          refreshToken:
            refreshToken && refreshToken.length > 0 ? refreshToken : oldToken,
          accessToken,
          user_id,
          enabled: true
        })
      )
    } catch (error) {
      captureException(error)
    }
  }
}

export const revokeWithingsAccess = (): Thunk => async (dispatch: Dispatch) => {
  dispatch(withingsRevokeSuccess())
  dispatch(setMainSource(SOURCE.NO_SOURCE))
}

export const getWithingsSleep = (
  startDate?: string,
  endDate?: string
): Thunk => async (dispatch: Dispatch, getState: GetState) => {
  const { accessToken, accessTokenExpirationDate } = getWithingsToken(
    getState()
  )
  dispatch(fetchSleepWithingsStart())

  const start = startDate || moment().subtract(1, 'week').format('YYYY-MM-DD')
  const end = endDate || moment().format('YYYY-MM-DD')

  const dataFields =
    'deepsleepduration,durationtosleep,durationtowakeup,sleep_score,snoring, snoringepisodecount'

  if (accessToken) {
    try {
      if (moment(accessTokenExpirationDate).isAfter(moment())) {
        const withingsApiCall = await fetch(
          `https://wbsapi.withings.net/v2/sleep?action=getsummary&startdateymd=${start}&enddateymd=${end}&data_fields=${dataFields}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        const response = await withingsApiCall.json()
        const formattedResponse = formatWithingsSamples(response.body.series)
        console.log(response)

        dispatch(formatSleepData(formattedResponse))
        dispatch(fetchSleepWithingsSuccess())
      } else {
        await dispatch(refreshWithingsToken())

        const withingsApiCall = await fetch(
          `https://wbsapi.withings.net/v2/sleep?action=getsummary&startdateymd=${start}&enddateymd=${end}&data_fields=${dataFields}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        const response = await withingsApiCall.json()
        const formattedResponse = formatWithingsSamples(response.body.series)
        console.log(response)
        dispatch(formatSleepData(formattedResponse))
        dispatch(fetchSleepWithingsSuccess())
      }
    } catch (error) {
      dispatch(fetchSleepWithingsFailure())
      captureException(error)
    }
  }
}

interface WithingsRefreshResult extends RefreshResult {
  refreshToken: string
  additionalParameters: {
    userid: string
  }
}

interface WithingsAuthorizeResult extends AuthorizeResult {
  refreshToken: string
  tokenAdditionalParameters: {
    userid: string
  }
}

export type WithingAuthResponse = {
  accessTokenExpirationDate: string
  refreshToken: string
  accessToken: string
  user_id: string
  enabled: boolean
}