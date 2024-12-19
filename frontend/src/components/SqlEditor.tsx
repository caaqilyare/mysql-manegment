import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { PlayArrow as RunIcon } from '@mui/icons-material';

interface SqlEditorProps {
  database: string;
  onQueryResult?: (result: any) => void;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ database, onQueryResult }) => {
  const [sql, setSql] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleExecuteQuery = async () => {
    if (!sql.trim()) return;

    setIsExecuting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          database,
          sql: sql.trim(),
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to execute query');
      }

      if (onQueryResult) {
        onQueryResult(result);
      }
    } catch (error: any) {
      console.error('Query execution error:', error);
      setError(error.message || 'Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
      }}
    >
      <Typography variant="h6" gutterBottom>
        SQL Query Editor
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          multiline
          rows={4}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="Enter your SQL query here..."
          variant="outlined"
          fullWidth
          error={!!error}
          helperText={error}
          disabled={isExecuting}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LoadingButton
            variant="contained"
            startIcon={<RunIcon />}
            onClick={handleExecuteQuery}
            loading={isExecuting}
            loadingPosition="start"
            disabled={!sql.trim()}
            sx={{
              background: 'linear-gradient(45deg, #6C63FF, #FF6584)',
              '&:hover': {
                background: 'linear-gradient(45deg, #8B85FF, #FF8DA3)',
              },
            }}
          >
            Execute Query
          </LoadingButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default SqlEditor;
