import React from 'react';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledFooter = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.neutral.lightGrey,
  padding: theme.spacing(3, 0),
  marginTop: 'auto',
}));
//hh
const Footer = () => {
  return (
    <StyledFooter>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} WhichFood. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, mt: { xs: 2, md: 0 } }}>
            <MuiLink href="#" variant="body2" color="text.secondary">
              Privacy Policy
            </MuiLink>
            <MuiLink href="#" variant="body2" color="text.secondary">
              Terms of Service
            </MuiLink>
            <MuiLink href="#" variant="body2" color="text.secondary">
              Contact Us
            </MuiLink>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 2, md: 0 } }}>
            Powered by <MuiLink href="https://www.edamam.com/" target="_blank" rel="noopener noreferrer">Edamam</MuiLink>
          </Typography>
        </Box>
      </Container>
    </StyledFooter>
  );
};

export default Footer;
