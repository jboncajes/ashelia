import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "../components/Navbar";
import BottomTabs from "../components/BottomTabs";

function MainLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Navbar />

      <Box
        component="main"
        sx={{
          flex: 1,
          p: 2,
          pt: 0,
          maxWidth: "sm",
          mx: "auto",
          width: "100%",
        }}
      >
        <Outlet />
      </Box>

      <BottomTabs />
    </Box>
  );
}

export default MainLayout;