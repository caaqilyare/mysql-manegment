import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Dataset as DatabaseIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

interface DatabaseLoginProps {
  onLogin: (value: boolean) => void;
}

export const DatabaseLogin = ({ onLogin }: DatabaseLoginProps) => {
  const [host, setHost] = useState('localhost');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          host: host.includes('://') ? host.split('://')[1].split(':')[0] : host,
          user, 
          password 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.message) {
        onLogin(true);
      } else {
        const errorMessage = data.details || data.error || 'Connection failed';
        console.error('Connection error:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Failed to connect to server';
      console.error('Connection error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle at center, 
          ${alpha(theme.palette.primary.main, 0.15)} 0%, 
          ${alpha(theme.palette.background.default, 1)} 70%)`,
        position: 'relative',
        overflow: 'hidden',
        m: 0,
        p: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '200%',
          height: '200%',
          background: `linear-gradient(45deg, 
            ${alpha(theme.palette.primary.main, 0.1)} 0%, 
            transparent 20%, 
            ${alpha(theme.palette.secondary.main, 0.1)} 40%, 
            transparent 60%, 
            ${alpha(theme.palette.primary.main, 0.1)} 80%)`,
          animation: 'gradient 15s linear infinite',
          transform: 'translate(-50%, -50%)',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, 
                ${theme.palette.primary.main}, 
                ${theme.palette.secondary.main}, 
                ${theme.palette.primary.main})`,
              backgroundSize: '200% 100%',
              animation: 'gradient 15s ease infinite',
            },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.2)}, 
                    ${alpha(theme.palette.secondary.main, 0.2)})`,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DatabaseIcon
                  sx={{
                    fontSize: 48,
                    color: theme.palette.primary.main,
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                  }}
                />
              </Box>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textAlign: 'center',
                  mb: 1,
                }}
              >
                Database Manager
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: theme.palette.text.secondary,
                  textAlign: 'center',
                  mb: 3,
                }}
              >
                Connect to your database
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <StorageIcon sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                },
              }}
            />

            <TextField
              fullWidth
              label="Username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 2,
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '200%',
                  height: '100%',
                  background: `linear-gradient(90deg, 
                    transparent, 
                    rgba(255, 255, 255, 0.2), 
                    transparent)`,
                  animation: loading ? 'shimmer 2s infinite' : 'none',
                },
              }}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'white',
                  }}
                />
              ) : (
                'Connect'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>

      <style>
        {`
          @keyframes gradient {
            0% { backgroundPosition: 0% 50%; }
            50% { backgroundPosition: 100% 50%; }
            100% { backgroundPosition: 0% 50%; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          elevation={6}
          variant="filled"
          severity="error"
          onClose={() => setError('')}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};
