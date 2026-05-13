import React from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonIcon from "@mui/icons-material/Person";

function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveValue = () => {
    const path = location.pathname;
    if (path === "/" || path.startsWith("/home")) return 0;
    if (path.startsWith("/streaks")) return 1;
    if (path.startsWith("/profile")) return 2;
    return 0;
  };

  const handleChange = (_, newValue) => {
    const routes = ["/", "/streaks", "/profile"];
    navigate(routes[newValue]);
  };

  return (
    <BottomNavigation
      value={getActiveValue()}
      onChange={handleChange}
      showLabels
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <BottomNavigationAction
        label="Home"
        icon={<HomeIcon />}
        sx={{ fontSize: "0.8rem" }}
      />
      <BottomNavigationAction
        label="Streaks"
        icon={<FavoriteIcon />}
        sx={{ fontSize: "0.8rem" }}
      />
      <BottomNavigationAction
        label="Profile"
        icon={<PersonIcon />}
        sx={{ fontSize: "0.8rem" }}
      />
    </BottomNavigation>
  );
}

export default BottomTabs;