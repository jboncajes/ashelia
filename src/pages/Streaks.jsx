import React from "react";
import { Box, Typography } from "@mui/material";

function Streaks() {
  return (
    <Box sx={{ mt: 3, textAlign: "center" }}>
      <Typography variant="h5" gutterBottom>
        Your Streak
      </Typography>
      <Typography variant="body1">
        You’re on a 7‑day streak.
      </Typography>
    </Box>
  );
}

export default Streaks;