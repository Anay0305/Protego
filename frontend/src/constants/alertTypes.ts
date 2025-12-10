export const ALERT_TYPES = {
  SCREAM: 'SCREAM',
  FALL: 'FALL',
  DISTRESS: 'DISTRESS',
  PANIC: 'PANIC',
  MOTION_ANOMALY: 'MOTION_ANOMALY',
  SOUND_ANOMALY: 'SOUND_ANOMALY',
  VOICE_ACTIVATION: 'VOICE_ACTIVATION',
  SOS: 'SOS',
} as const;

export const ALERT_TYPE_LABELS: Record<keyof typeof ALERT_TYPES, string> = {
  SCREAM: 'Scream',
  FALL: 'Fall Detected',
  DISTRESS: 'Distress',
  PANIC: 'Panic',
  MOTION_ANOMALY: 'Unusual Movement',
  SOUND_ANOMALY: 'Unusual Sound',
  VOICE_ACTIVATION: 'Voice Activation',
  SOS: 'SOS Alert',
};

export type AlertType = keyof typeof ALERT_TYPES;
