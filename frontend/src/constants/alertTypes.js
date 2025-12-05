/**
 * Alert Type Constants
 * Must match backend AlertType enum values (uppercase)
 */

export const ALERT_TYPES = {
  SCREAM: 'SCREAM',
  FALL: 'FALL',
  DISTRESS: 'DISTRESS',
  PANIC: 'PANIC',
  MOTION_ANOMALY: 'MOTION_ANOMALY',
  SOUND_ANOMALY: 'SOUND_ANOMALY',
  VOICE_ACTIVATION: 'VOICE_ACTIVATION',
};

export const ALERT_STATUS = {
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  TRIGGERED: 'triggered',
  SAFE: 'safe',
};

// Human-readable labels for alert types
export const ALERT_TYPE_LABELS = {
  [ALERT_TYPES.SCREAM]: 'Scream Detected',
  [ALERT_TYPES.FALL]: 'Fall Detected',
  [ALERT_TYPES.DISTRESS]: 'Distress Signal',
  [ALERT_TYPES.PANIC]: 'Panic Button',
  [ALERT_TYPES.MOTION_ANOMALY]: 'Motion Anomaly',
  [ALERT_TYPES.SOUND_ANOMALY]: 'Sound Anomaly',
  [ALERT_TYPES.VOICE_ACTIVATION]: 'Voice Activation',
};

export default ALERT_TYPES;
