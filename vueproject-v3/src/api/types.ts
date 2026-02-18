/**
 * @typedef {Object} Course
 * @property {number} id
 * @property {string} title
 * @property {string} category
 * @property {string} startTime
 * @property {string} endTime
 * @property {string} description
 * @property {string} image
 * @property {boolean} isDeleted
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Identity
 * @property {number} id
 * @property {string} account
 * @property {string} password
 * @property {string} role
 * @property {boolean} isDeleted
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Score
 * @property {number} id
 * @property {string} uploadTime
 * @property {string} image
 * @property {number} score
 * @property {boolean} isScored
 * @property {string|null} remark
 * @property {boolean} isDeleted
 * @property {string|null} createdAt
 * @property {string} updatedAt
 * @property {Course} course
 * @property {Identity} identity
 */
