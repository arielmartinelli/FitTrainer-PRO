import React from "react";
import { User } from "lucide-react";

export const StudentAvatar = ({ gender = "male", size = 44, name = "" }) => {
  const isFemale = gender === "female";

  const bg = isFemale ? "#FFEBF0" : "#EBF5FF";
  const color = isFemale ? "#FF2D55" : "#007AFF";
  const border = isFemale ? "1px solid rgba(255, 45, 85, 0.25)" : "1px solid rgba(0, 122, 255, 0.25)";

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: bg,
        border: border,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}
      title={name}
    >
      <User size={size * 0.52} color={color} strokeWidth={2.2} />
    </div>
  );
};
