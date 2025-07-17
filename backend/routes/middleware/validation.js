// routes/middleware/validation.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const validateRefreshParam = (req, res, next) => {
  req.forceRefresh = req.query.refresh === "true";
  next();
};

const validateStatusFilter = (req, res, next) => {
  if (req.query.statuses) {
    const statuses = req.query.statuses
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    req.statusFilter = statuses;
  } else {
    req.statusFilter = [];
  }
  next();
};

module.exports = {
  asyncHandler,
  validateRefreshParam,
  validateStatusFilter,
};
