import React from 'react';
import { Card, CardHeader, Divider } from '@mui/material';
import ResourceTable from './ResourceTable';

const ResourceCard = ({
  title,
  items,
  type,
  namespace,
  sortBy,
  setSortBy,
  onActionComplete,
  errorPodsOnly,
}) => {
  return (
    <Card sx={{ flex: '1 1 400px', minWidth: 350, maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
      <CardHeader title={title} />
      <Divider />
      <ResourceTable
        items={items}
        type={type}
        namespace={namespace}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onActionComplete={onActionComplete}
        errorPodsOnly={errorPodsOnly}
      />
    </Card>
  );
};

export default ResourceCard;
