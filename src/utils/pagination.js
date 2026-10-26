const MAX_ALLOWED_LIMIT = 50;

function createMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

function parsePositiveInteger(rawValue, fallbackValue) {
  if (rawValue === undefined) {
    return fallbackValue;
  }

  if (typeof rawValue !== "string" || !/^\d+$/.test(rawValue)) {
    return null;
  }

  const num = Number(rawValue);
  if (!Number.isSafeInteger(num) || num < 1) {
    return null;
  }

  return num;
}

function parseSort(query, allowedFields, sortByError) {
  const sortBy = query.sortBy === undefined ? allowedFields[0] : query.sortBy;
  if (typeof sortBy !== "string" || !allowedFields.includes(sortBy)) {
    return { error: sortByError };
  }

  const order = query.order === undefined ? "desc" : query.order;
  if (order !== "asc" && order !== "desc") {
    return { error: "order must be asc or desc" };
  }

  return { sortBy, order };
}

function parsePagination(query) {
  const parsedPage = parsePositiveInteger(query.page, 1);
  const targetLimit = parsePositiveInteger(query.limit, 10);

  if (parsedPage === null || targetLimit === null) {
    return { error: "page and limit must be positive integers" };
  }

  const pageLimit = Math.min(targetLimit, MAX_ALLOWED_LIMIT);
  const skipCount = (parsedPage - 1) * pageLimit;
  if (!Number.isSafeInteger(skipCount)) {
    return { error: "page and limit must be positive integers" };
  }

  return {
    page: parsedPage,
    limit: pageLimit,
    skip: skipCount,
  };
}

module.exports = {
  createMeta,
  parsePositiveInteger,
  parseSort,
  parsePagination,
};
