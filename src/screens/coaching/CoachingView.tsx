import React, { memo, useEffect } from 'react'
import { RefreshControl } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { getCoachingNotStarted } from 'store/Selectors/coaching-selectors/coaching-selectors'
import { getLoadingContent } from 'store/Selectors/content-selectors/content-selectors'
import { getAllWeeks } from '../../actions/coaching/content-actions'
import BuyCoachingButton from '../../components/CoachingSpecific/BuyCoachingButton'
import CoachingHeader from '../../components/CoachingSpecific/CoachingHeader'
import CoachingNotStarted from '../../components/CoachingSpecific/CoachingNotStarted'
import NewHabitModal from '../../components/modals/HabitModal/NewHabitModal'
import { SafeAreaView } from '../../components/Primitives/Primitives'
import TopInfo from '../../components/TopInfo'
import { WIDTH } from '../../helpers/Dimensions'
import { getActiveCoaching } from '../../store/Selectors/subscription-selectors/SubscriptionSelectors'
import colors from '../../styles/colors'
import Lessons from './Lessons'

export const cardWidth = WIDTH - 40
export const cardMargin = 5

const CoachingScreen = () => {
  const hasActiveCoaching = useSelector(getActiveCoaching)
  const loadingContent = useSelector(getLoadingContent) as boolean
  const dispatch = useDispatch()

  const refreshContent = async () => {
    dispatch(getAllWeeks())
  }

  return (
    <SafeAreaView>
      <TopInfo />
      <Lessons
        useCurrentWeek
        refreshControl={
          <RefreshControl
            refreshing={loadingContent}
            tintColor={colors.radiantBlue}
            onRefresh={refreshContent}
          />
        }
        header={<CoachingHeader />}
      />
      <CoachingNotStarted />
      {!hasActiveCoaching && <BuyCoachingButton />}
      <NewHabitModal />
    </SafeAreaView>
  )
}

export default memo(CoachingScreen)
