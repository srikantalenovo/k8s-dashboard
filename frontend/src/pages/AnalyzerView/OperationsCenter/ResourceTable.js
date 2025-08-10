import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, IconButton, Tooltip, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ScaleIcon from '@mui/icons-material/TrackChanges';
import UninstallIcon from '@mui/icons-material/RemoveCircleOutline';

import ActionButtons from './ActionButtons';

const getComparator = (order, orderBy) => {
  return (a, b) => {
    if (!a[orderBy]) return 1;
    if (!b[orderBy]) return -1;
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
    return 0;
  };
};

const stableSort = (array, comparator) => {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    if (cmp !== 0) return cmp;
    return a[1] - b[1];
  });
  return stabilized.map(el => el[0]);
};

const ResourceTable = ({
  items,
  type,
  sortBy,
  setSortBy,
  onActionComplete,
  errorPodsOnly,
}) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(sortBy || 'name');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setSortBy(property);
  };

  if (!items || items.length === 0) {
    return <Typography variant="body2" sx={{ p: 2 }}>No {type} found.</Typography>;
  }

  // Define table columns based on resource type
  let columns = [];
  switch (type) {
    case 'pods':
      columns = [
        { id: 'name', label: 'Pod Name' },
        { id: 'status', label: 'Status' },
        { id: 'namespace', label: 'Namespace' },
        { id: 'nodeName', label: 'Node' },
        { id: 'restarts', label: 'Restarts' },
        { id: 'actions', label: 'Actions', sortable: false }
      ];
      break;
    case 'services':
      columns = [
        { id: 'name', label: 'Service Name' },
        { id: 'namespace', label: 'Namespace' },
        { id: 'type', label: 'Type' },
        { id: 'clusterIP', label: 'Cluster IP' },
        { id: 'ports', label: 'Ports' },
      ];
      break;
    case 'deployments':
      columns = [
        { id: 'name', label: 'Deployment Name' },
        { id: 'namespace', label: 'Namespace' },
        { id: 'replicas', label: 'Replicas' },
        { id: 'readyReplicas', label: 'Ready' },
        { id: 'availableReplicas', label: 'Available' },
        { id: 'strategy', label: 'Strategy' },
        { id: 'actions', label: 'Actions', sortable: false }
      ];
      break;
    case 'helm':
      columns = [
        { id: 'name', label: 'Release Name' },
        { id: 'namespace', label: 'Namespace' },
        { id: 'chart', label: 'Chart' },
        { id: 'status', label: 'Status' },
        { id: 'actions', label: 'Actions', sortable: false }
      ];
      break;
    default:
      return <Typography>Unsupported resource type: {type}</Typography>;
  }

  const sortedItems = stableSort(items, getComparator(order, orderBy));

  return (
    <TableContainer sx={{ maxHeight: '70vh' }}>
      <Table stickyHeader size="small" aria-label={`${type} table`}>
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell
                key={col.id}
                sortDirection={orderBy === col.id ? order : false}
                sx={{ minWidth: col.id === 'actions' ? 100 : 120 }}
              >
                {col.sortable === false ? (
                  col.label
                ) : (
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : 'asc'}
                    onClick={() => handleRequestSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map(item => (
            <TableRow key={item.name}>
              {type === 'pods' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Typography
                      color={
                        item.status === 'Running' ? 'green' :
                        item.status === 'Failed' || item.status === 'CrashLoopBackOff' ? 'error' : 'textPrimary'
                      }
                    >
                      {item.status}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.namespace}</TableCell>
                  <TableCell>{item.nodeName}</TableCell>
                  <TableCell>{item.restarts}</TableCell>
                  <TableCell>
                    <ActionButtons type="pod" resource={item} onActionComplete={onActionComplete} />
                  </TableCell>
                </>
              )}
              {type === 'services' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.namespace}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.clusterIP}</TableCell>
                  <TableCell>{item.ports?.map(p => p.port).join(', ')}</TableCell>
                </>
              )}
              {type === 'deployments' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.namespace}</TableCell>
                  <TableCell>{item.replicas}</TableCell>
                  <TableCell>{item.readyReplicas}</TableCell>
                  <TableCell>{item.availableReplicas}</TableCell>
                  <TableCell>{item.strategy}</TableCell>
                  <TableCell>
                    <ActionButtons type="deployment" resource={item} onActionComplete={onActionComplete} />
                  </TableCell>
                </>
              )}
              {type === 'helm' && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.namespace}</TableCell>
                  <TableCell>{item.chart}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>
                    <ActionButtons type="helm" resource={item} onActionComplete={onActionComplete} />
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResourceTable;
