import React from "react";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";

function Home() {
  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today’s Question
          </Typography>
          <Typography variant="body1" paragraph>
            "What’s one thing you love about our relationship?"
          </Typography>
          <Button variant="contained" color="primary" size="large">
            Answer
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Home;