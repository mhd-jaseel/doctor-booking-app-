/**
 * Standard Backend Pagination Utility
 *
 * Provides safe parsing of page and limit parameters, ensures maximum boundaries,
 * and generates consistent pagination metadata.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Extracts normalized page, limit, and skip values from query parameters.
 *
 * @param {string|number} rawPage - Page requested from query
 * @param {string|number} rawLimit - Limit requested from query
 * @param {number} defaultLimit - Screen-specific default limit (defaults to 10)
 * @param {number} maxLimit - Absolute ceiling limit (defaults to 50)
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPagination = (
  rawPage,
  rawLimit,
  defaultLimit = DEFAULT_LIMIT,
  maxLimit = MAX_LIMIT
) => {
  let page = parseInt(rawPage, 10);
  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  let limit = parseInt(rawLimit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  }

  // Enforce ceiling: client cannot request unbounded records
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Builds standard pagination response metadata.
 *
 * @param {number} totalItems - Total number of documents matching the query filter
 * @param {number} page - Current active page number
 * @param {number} limit - Number of records per page
 * @returns {{ currentPage: number, limit: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean }}
 */
const buildPaginationMetadata = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const currentPage = Math.min(page, totalPages > 0 ? totalPages : 1);

  return {
    currentPage: page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  getPagination,
  buildPaginationMetadata,
};
