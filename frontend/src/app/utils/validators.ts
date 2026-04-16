/**
 * Client-side validation helpers.
 * Returns error strings or null (valid).
 */

export function validateBirthday(value: string): string | null {
  if (!value) return "Birthday is required";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Invalid date format";
  if (d.getFullYear() < 1900 || d.getFullYear() > new Date().getFullYear())
    return "Year must be between 1900 and today";
  return null;
}

export function validateEventTitle(title: string): string | null {
  if (!title.trim()) return "Event title is required";
  if (title.length > 80) return "Title must be 80 characters or fewer";
  return null;
}

export function validateEventDate(date: string): string | null {
  if (!date) return "Date is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Date must be in YYYY-MM-DD format";
  return null;
}

export function validateAddress(addr: string): string | null {
  if (!addr) return "Address is required";
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return "Must be a valid Ethereum address (0x...)";
  return null;
}

export function validateMessage(msg: string): string | null {
  if (!msg.trim()) return "Message cannot be empty";
  if (msg.length > 500) return "Message must be 500 characters or fewer";
  return null;
}

export function validateWishlistItemName(name: string): string | null {
  if (!name.trim()) return "Item name is required";
  if (name.length > 60) return "Name must be 60 characters or fewer";
  return null;
}
