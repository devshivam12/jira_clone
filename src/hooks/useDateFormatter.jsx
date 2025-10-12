// hooks/useDateFormatter.js
import { useCallback } from "react";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/**
 * useDateFormatter(format = "dd/MM/yyyy", mode = undefined)
 *
 * - format: token-based string. supports dd, MM (or mm), MMM, MMMM, yyyy (or YYYY), yy
 * - mode: 'datetime' -> append "HH:mm:ss"
 *         true -> append "HH:mm"
 *
 * Returns a function: (dateInput) => formattedString
 */
export default function useDateFormatter(format = "dd/MM/yyyy", mode) {
  const includeSeconds = mode === "datetime";
  const includeMinutesOnly = mode === true;

  // Return a stable formatter function
  return useCallback(
    (dateInput) => {
      if (dateInput === undefined || dateInput === null || dateInput === "") return "";

      // Accept Date object, number (timestamp) or string
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(date.getTime())) return ""; // invalid date

      const day = String(date.getDate()).padStart(2, "0");
      const monthNum = String(date.getMonth() + 1).padStart(2, "0");
      const monthShort = MONTHS_SHORT[date.getMonth()];
      const monthLong = MONTHS_LONG[date.getMonth()];
      const year4 = String(date.getFullYear());
      const year2 = year4.slice(-2);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      // We do replacements in an order that avoids clobbering (MMMM -> MMM -> MM ...)
      let out = String(format);

      // Support both lowercase and uppercase tokens (yyyy/ YYYY)
      out = out.replace(/MMMM/g, monthLong);
      out = out.replace(/MMM/g, monthShort);

      // replace MM or mm (two-digit month). Use regex with case-insensitive fallback
      out = out.replace(/MM/g, monthNum);
      out = out.replace(/mm/g, monthNum);

      out = out.replace(/dd/g, day);
      out = out.replace(/yyyy/gi, year4);
      out = out.replace(/yy/g, year2);

      if (includeSeconds) {
        out += ` ${hours}:${minutes}:${seconds}`;
      } else if (includeMinutesOnly) {
        out += ` ${hours}:${minutes}`;
      }

      return out;
    },
    [format, mode] // recreate only when format/mode change
  );
}
