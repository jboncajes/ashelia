import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createCouple } from "../services/partnerService";
import useStore from "../store/useStore";

function CreateCouple() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    coupleName: "",
    partnerAName: "",
    partnerBName: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const err = {};

    if (!form.coupleName.trim()) {
      err.coupleName = "Couple name is required.";
    }
    if (!form.partnerAName.trim()) {
      err.partnerAName = "Partner A name is required.";
    }
    if (!form.partnerBName.trim()) {
      err.partnerBName = "Partner B name is required.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const result = await createCouple(
      form.coupleName.trim(),
      form.partnerAName.trim(),
      form.partnerBName.trim(),
    );

    setSubmitting(false);

    if (result.success) {
      // UseStore is already updated inside createCouple.
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
          Create Couple
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Start a new couple in Ashelia. You’ll share this with your partner so they can join.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <form onSubmit={handleSubmit}>
          <TextField
            name="coupleName"
            label="Couple Name"
            value={form.coupleName}
            onChange={handleChange}
            error={Boolean(errors.coupleName)}
            helperText={errors.coupleName}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            name="partnerAName"
            label="Your Name (Partner A)"
            value={form.partnerAName}
            onChange={handleChange}
            error={Boolean(errors.partnerAName)}
            helperText={errors.partnerAName}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            name="partnerBName"
            label="Partner’s Name (Partner B)"
            value={form.partnerBName}
            onChange={handleChange}
            error={Boolean(errors.partnerBName)}
            helperText={errors.partnerBName}
            fullWidth
            margin="normal"
            required
          />

          {errors.server && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {errors.server}
            </Typography>
          )}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Couple"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default CreateCouple;