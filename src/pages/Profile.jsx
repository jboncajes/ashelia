import React from "react";
import { Box, Typography } from "@mui/material";

function Profile() {
  const { currentCouple, partners, appState } = useStore.getState();
  const partner = Object.values(partners).find((p) => p.id === appState.userId);
  const code =
    partner?.isPartnerA === true
      ? currentCouple?.partnerACode
      : currentCouple?.partnerBCode;
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Profile
      </Typography>
      <Typography variant="body1">
        Your partner profile and settings will appear here.
      </Typography>
    </Box>
  );
}

export default Profile;