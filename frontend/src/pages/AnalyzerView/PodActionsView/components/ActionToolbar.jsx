import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  useTheme,
} from '@mui/material';
import {
  Refresh,
  Add,
  FilterAlt,
} from '@mui/icons-material';
import { tokens } from '../../../theme';

const ActionToolbar = ({ 
  namespace, 
  onNamespaceChange, 
  onReload,
  resourceType,
  namespaces = [],
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 1,
      backgroundColor: colors.primary[400],
      borderBottom: `1px solid ${colors.grey[700]}`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Namespace</InputLabel>
          <Select
            value={namespace}
            onChange={(e) => onNamespaceChange(e.target.value)}
            label="Namespace"
          >
            {namespaces.map((ns) => (
              <MenuItem key={ns} value={ns}>
                {ns}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title={`Refresh ${resourceType}`}>
          <IconButton onClick={onReload}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          size="small"
          placeholder={`Filter ${resourceType}...`}
          variant="outlined"
          sx={{ 
            width: 250,
            '& .MuiOutlinedInput-root': {
              backgroundColor: colors.primary[600],
            },
          }}
        />
        <Tooltip title="Advanced Filters">
          <IconButton>
            <FilterAlt />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ActionToolbar;