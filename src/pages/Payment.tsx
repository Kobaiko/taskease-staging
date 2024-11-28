import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { processPayment } from '../services/payment';
import { Button, Card, Container, Typography, Box, CircularProgress } from '@mui/material';

export default function Payment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const amount = parseFloat(searchParams.get('amount') || '0');
  const userId = searchParams.get('userId') || '';
  const isSubscription = searchParams.get('subscription') === 'true';
  const isYearly = searchParams.get('yearly') === 'true';

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      const paymentUrl = await processPayment(userId, amount, {
        isSubscription,
        isYearly
      });
      
      // Instead of redirecting, we'll submit a form to open in a new window
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;
      form.target = '_blank';
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
    } catch (error) {
      console.error('Payment processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentDescription = () => {
    if (isSubscription) {
      return `TaskEase ${isYearly ? 'Yearly' : 'Monthly'} Subscription`;
    }
    return 'TaskEase Credits';
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Payment Details
        </Typography>
        
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            {getPaymentDescription()}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Amount: ${amount.toFixed(2)} USD
          </Typography>
          <Typography variant="body2" color="text.secondary">
            (Approximately ₪{(amount * 3.7).toFixed(2)} ILS)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : null}
          >
            {isProcessing ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </Box>
      </Card>
    </Container>
  );
}
