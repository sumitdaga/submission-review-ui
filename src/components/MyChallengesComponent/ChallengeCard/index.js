/**
 * Component to render a row for ChallengeList component
 */
import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import moment from 'moment'
import 'moment-duration-format'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faUser } from '@fortawesome/free-solid-svg-icons'
import Table from '../../Table'
import TrackIcon from '../../TrackIcon'
import styles from './ChallengeCard.module.scss'
import { getFormattedDuration, getLastDate } from '../../../util/date'

const { Row, Col } = Table

const STALLED_MSG = 'Stalled'
const DRAFT_MSG = 'In Draft'
const STALLED_TIME_LEFT_MSG = 'Challenge is currently on hold'
const FF_TIME_LEFT_MSG = 'Winner is working on fixes'

const getEndDate = (c) => {
  let phases = c.allPhases
  if (c.subTrack === 'FIRST_2_FINISH' && c.status === 'COMPLETED') {
    phases = c.allPhases.filter(p => p.phaseType === 'Iterative Review' && p.phaseStatus === 'Closed')
  }
  const endPhaseDate = getLastDate(phases.map(d => new Date(d.scheduledEndTime)))
  return moment(endPhaseDate).format('MMM DD')
}

/**
 * Format the remaining time of a challenge phase
 * @param phase Challenge phase
 * @returns {*}
 */
const getTimeLeft = (phase) => {
  if (!phase) return STALLED_TIME_LEFT_MSG
  if (phase.phaseType === 'Final Fix') {
    return FF_TIME_LEFT_MSG
  }

  let time = moment(phase.scheduledEndTime).diff()
  const late = time < 0
  if (late) time = -time
  const duration = getFormattedDuration(time)
  return late ? `Late by ${duration}` : `${duration} to go`
}

/**
 * Find current phase and remaining time of it
 * @param c Challenge
 * @returns {{phaseMessage: string, endTime: {late, text}}}
 */
const getPhaseInfo = (c) => {
  const { allPhases, currentPhases, subTrack, status } = c
  const checkPhases = (currentPhases && currentPhases.length > 0 ? currentPhases : allPhases)
  let statusPhase = checkPhases
    .filter(p => p.phaseType !== 'Registration')
    .sort((a, b) => moment(a.scheduledEndTime).diff(b.scheduledEndTime))[0]

  if (!statusPhase && subTrack === 'FIRST_2_FINISH' && checkPhases.length) {
    statusPhase = Object.clone(checkPhases[0])
    statusPhase.phaseType = 'Submission'
  }
  let phaseMessage = STALLED_MSG
  if (statusPhase) phaseMessage = statusPhase.phaseType
  else if (status === 'DRAFT') phaseMessage = DRAFT_MSG

  const endTime = getTimeLeft(statusPhase)
  return { phaseMessage, endTime }
}

const ChallengeCard = ({ challenge, options, history }) => {
  const roles = []
  challenge.userDetails && challenge.userDetails.roles && challenge.userDetails.roles.some((r, i, arr) => {
    if (i < 2) {
      roles.push(<span className='block' key={`challenge-role-${r}-${i}`}>{r}</span>)
      return false
    } else {
      roles.push(<span className='block' key={`challenge-role-${r}-${i}`}>{arr.length - 2} more</span>)
      return true
    }
  })
  const { phaseMessage, endTime } = getPhaseInfo(challenge)
  const challengeLink = `/challenges/${challenge.id}`

  return (
    <Row className={styles.item}>
      <Col width={options[0].width} className={styles.challengeName} to={challengeLink}>
        <div>
          <TrackIcon className={styles.icon} track={challenge.track} subTrack={challenge.subTrack} />
        </div>
        <div className='name'>
          <span className='block'>{challenge.name}</span>
          <span className='block light-text'>Ends {getEndDate(challenge)}</span>
        </div>
      </Col>
      <Col width={options[1].width} to={challengeLink}>{roles}</Col>
      <Col width={options[2].width} to={challengeLink}>
        <span className='block'>{phaseMessage}</span>
        <span className='block light-text'>{endTime}</span>
      </Col>
      <Col width={options[3].width} to={challengeLink}>
        <div className={styles.stats}>
          <div className={styles.faIconContainer}>
            <FontAwesomeIcon icon={faUser} className={styles.faIcon} />
            <span>{challenge.numRegistrants}</span>
          </div>
          <div className={styles.faIconContainer}>
            <FontAwesomeIcon icon={faFile} className={styles.faIcon} />
            <span>{challenge.numSubmissions}</span>
          </div>
        </div>
      </Col>
    </Row>
  )
}

ChallengeCard.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  challenge: PropTypes.object,
  history: PropTypes.object
}

export default withRouter(ChallengeCard)
