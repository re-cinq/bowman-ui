import { useState } from "react";
import { TextField } from "@re-cinq/bowman-ui";

// Validation is the consumer's: the field only shows the error it is handed.
const emailError = (value: string): string | undefined =>
  value === "" || value.includes("@") ? undefined : "Enter an address like name@example.com.";

export function TextFieldExample() {
  const [email, setEmail] = useState("");

  return (
    <TextField
      type="email"
      autoComplete="email"
      required
      value={email}
      onChange={setEmail}
      labels={{
        fieldLabel: "Email address (required)",
        fieldHint: "We send the delivery updates here.",
        fieldError: emailError(email),
      }}
    />
  );
}
