// utils/responseFormatter.js
export const formatK8sResponse = ({
  status = 'success',
  filters = {},
  summary = {},
  data = [],
  errors = []
} = {}) => {
  return {
    status,
    timestamp: new Date().toISOString(),
    filters,
    summary,
    data,
    errors
  };
};
