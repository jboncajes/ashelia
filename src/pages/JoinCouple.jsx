import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { joinCoupleByCode } from "../services/partnerService";
import { v4 as uuidv4 } from "uuid";
import useStore from "../store/useStore";

function JoinCouple() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length > 6) {
      value = value.slice(0, 6);
    }
    setCode(value);
  };

  const validate = () => {
    const err = {};

    if (!code) {
      err.code = "Partner code is required.";
    } else if (code.length !== 6) {
      err.code = "Partner code must be exactly 6 characters.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const result = await joinCoupleByCode(code);

    setSubmitting(false);

    if (result.success) {
      navigate("/");
    } else {
      setErrors({ server: result.error });
    }
  };

  const { coupleId } = useStore.getState();

  if (coupleId) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error" gutterBottom>
          You’re already in a couple.
        </Typography>
        <Typography variant="body1">
          Go to the Home page to answer today’s question or view your streaks.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper
        sx={{
          maxWidth: "sm",
          width: "100%",
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Join Couple
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Enter your partner’s 6‑digit code below to join your couple in Ashelia.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            mt: 2,
            mb: 3,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: "3rem",
                height: "3.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 1,
                bgcolor: "grey.100",
                border: "1.5px solid",
                borderColor: errors.code && !code[i] ? "error.main" : "divider",
                fontSize: "1.5rem",
                fontWeight: "600",
              }}
            >
              {code[i] || ""}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "none" }}>
          <TextField
            inputRef={(ref) => {
              if (ref) {
                ref.focus = () => {
                  // We’ll fake focusing all inputs via side effect later if needed.
                  ref.parentElement?.focus();
                };
              }
            }}
            name="code"
            label="Partner Code"
            value={code}
            onChange={handleChange}
            error={Boolean(errors.code)}
            helperText={errors.code}
            fullWidth
            margin="normal"
            required
          />
        </Box>

        {errors.server && (
          <Typography variant="body2" color="error" sx={{ my: 1 }}>
            {errors.server}
          </Typography>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Joining..." : "Join Couple"}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don’t have a code? Ask your partner to create a couple in Ashelia
            and share their code with you.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default JoinCouple;