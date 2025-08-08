import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Button,
  LinearProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Close,
  Download,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import { tokens } from '../../../../theme';

const LogsModal = ({ open, onClose, pod, namespace }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [logs, setLogs] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !pod) return;
    
    setLogs('');
    setIsLoading(true);
    setError(null);
    
    const eventSource = new EventSource(
      `/api/k8s/pods/${pod.name}/logs?namespace=${namespace}&tailLines=500`
    );

    eventSource.onmessage = (e) => {
      if (!isPaused) {
        setLogs(prev => prev + e.data + '\n');
      }
    };

    eventSource.onerror = () => {
      setIsLoading(false);
      setError('Failed to stream logs');
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsLoading(false);
    };
  }, [open, pod, namespace, isPaused]);

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pod?.name}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80vw',
    height: '80vh',
    bgcolor: colors.primary[400],
    boxShadow: 24,
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="logs-modal-title"
    >
      <Box sx={style}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${colors.grey[700]}`,
          backgroundColor: colors.blueAccent[700],
        }}>
          <Typography variant="h6" id="logs-modal-title">
            Logs: {pod?.name || 'Loading...'}
          </Typography>
          <Box>
            <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
              <IconButton onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton onClick={handleDownload}>
                <Download />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {isLoading && <LinearProgress />}

        <Box sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          backgroundColor: colors.primary[400],
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        }}>
          {error ? (
            <Typography color="error">{error}</Typography>
          ) : logs ? (
            logs
          ) : (
            <Typography>Connecting to logs stream...</Typography>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default LogsModal;