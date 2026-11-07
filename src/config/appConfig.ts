/**
 * Dyad Private Two-User Messenger Configuration
 * 
 * Edit this file to customize:
 * - Application name & branding
 * - Authorized user email defaults
 * - Ephemeral message expiration duration
 */

export const APP_CONFIG = {
  // Configurable Application Name
  appName: 'Dyad',
  tagline: 'Private Two-User Channel',
  version: '1.0.0',

  // Pre-authorized primary user (Creator / Admin)
  defaultUser1Email: 'prinsarya52@gmail.com',
  authorizedOwnerEmails: ['prinsarya52@gmail.com', 'pk7922927@gmail.com'],

  // Pre-authorized secondary user email (optional: if left empty, User 2 can join via the private invite code)
  defaultUser2Email: '',

  // Message expiration duration in days (Strictly 5 days as requested)
  messageExpiryDays: 5,

  // Duration in milliseconds (5 days = 5 * 24 * 60 * 60 * 1000)
  messageExpiryMs: 5 * 24 * 60 * 60 * 1000,

  // Firestore TTL setup documentation
  ttlDocumentation: {
    description: 'Every message has an expireAt Firestore Timestamp field set to exactly 5 days from creation. Dyad performs automatic client-side pruning on load, and you can also turn on Firestore native TTL in Google Cloud Console for 100% free automated background deletion on the Firebase Spark (free) plan.',
    gcloudCommand: 'gcloud firestore fields ttls update expireAt --collection-group=messages --enable-ttl',
    consoleUrl: 'https://console.cloud.google.com/firestore/databases/(default)/ttls',
  },
};
