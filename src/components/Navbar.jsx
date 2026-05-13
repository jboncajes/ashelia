import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";

function Navbar() {
  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Ashelia
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;