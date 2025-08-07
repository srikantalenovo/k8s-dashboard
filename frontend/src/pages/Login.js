import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Link
} from '@mui/material';
import {
  Email as EmailIcon,
  VpnKey as PasswordIcon,
  LockOpen as LoginIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const AuthContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', //theme change
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2)
}));

const AuthCard = styled(motion.div)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 420,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.2)'
}));

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', showPassword: false });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({
        email: formData.email.trim(),
        password: formData.password
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword });
  };

  return (
    <AuthContainer>
      <AuthCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <LoginIcon sx={{ fontSize: 60, color: 'white' }} />
          </motion.div>
          <Typography variant="h4" sx={{ color: 'white', mt: 2, fontWeight: 'bold' }}>
            Sign In
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
            Welcome back to GrepMind
          </Typography>
        </Box>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography
              color="error"
              sx={{
                mb: 2,
                textAlign: 'center',
                backgroundColor: 'rgba(255,0,0,0.1)',
                padding: 1,
                borderRadius: 1
              }}
            >
              {error}
            </Typography>
          </motion.div>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />,
              sx: { color: 'white' }
            }}
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
              }
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type={formData.showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              startAdornment: <PasswordIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {formData.showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { color: 'white' }
            }}
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' }
              }
            }}
          />

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              startIcon={<LoginIcon />}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '10px'
              }}
            >
              Sign In
            </Button>
          </motion.div>
        </Box>

        <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mt: 2 }}>
          Don&apos;t have an account?{' '}
          <Link
            component={RouterLink}
            to="/signup"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Sign Up
          </Link>
        </Typography>
      </AuthCard>
    </AuthContainer>
  );
};

export default Login;
