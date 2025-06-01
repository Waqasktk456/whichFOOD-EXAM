import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.colors.primary.main,
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.colors.primary.contrastText,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.colors.primary.contrastText,
  marginLeft: theme.spacing(2),
}));

const Header = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  
  // Mock authentication state for demonstration
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({
    name: 'John Doe',
    avatar: 'https://source.unsplash.com/random/100x100/?portrait'
  });

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    // In a real app, this would call the logout API
    setIsAuthenticated(false);
    handleCloseUserMenu();
    navigate('/');
  };

  return (
    <StyledAppBar position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo for desktop */}
          <Logo
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
          >
            WhichFood
          </Logo>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              <MenuItem onClick={handleCloseNavMenu} component={Link} to="/health">
                <Typography textAlign="center">Health Dashboard</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseNavMenu} component={Link} to="/meals">
                <Typography textAlign="center">Meal Logging</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseNavMenu} component={Link} to="/recommendations">
                <Typography textAlign="center">Recommendations</Typography>
              </MenuItem>
            </Menu>
          </Box>

          {/* Logo for mobile */}
          <Logo
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}
          >
            WhichFood
          </Logo>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <NavButton
              component={Link}
              to="/health"
              onClick={handleCloseNavMenu}
            >
              Health Dashboard
            </NavButton>
            <NavButton
              component={Link}
              to="/meals"
              onClick={handleCloseNavMenu}
            >
              Meal Logging
            </NavButton>
            <NavButton
              component={Link}
              to="/recommendations"
              onClick={handleCloseNavMenu}
            >
              Recommendations
            </NavButton>
          </Box>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            {isAuthenticated ? (
              <>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user.name} src={user.avatar} />
                </IconButton>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">Profile</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex' }}>
                <NavButton component={Link} to="/login">
                  Login
                </NavButton>
                <NavButton component={Link} to="/register" variant="contained" color="secondary">
                  Register
                </NavButton>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Header;
