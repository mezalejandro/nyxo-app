import React, { memo } from 'react'
import { Switch } from 'react-native'
import styled from 'styled-components/native'
import { P } from '../Primitives/Primitives'
import { NotificationDataItemProps } from '../../screens/settings/Notifications'
import { constants, StyleProps } from '../../styles/themes'

const NotificationRow = (props: NotificationDataItemProps) => {
  const onValueChange = (value: boolean) => {
    props.pressSwitch(props.actionType, value)
  }
  return (
    <Wrapper>
      <Container>
        <P>{props.title}</P>
        <Switch value={props.enabled} onValueChange={onValueChange} />
      </Container>
    </Wrapper>
  )
}

export default memo(NotificationRow)

const Wrapper = styled.View`
  padding: 10px 0px;
  border-bottom-width: ${constants.hairlineWidth}px;
  border-bottom-color: ${(props: StyleProps) => props.theme.HAIRLINE_COLOR};
`

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`
