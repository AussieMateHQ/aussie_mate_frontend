// Cleaner-facing surfaces should never show a customer's full street address
// (unit/house number + street name) - only the suburb and postcode. Archit's
// reasoning: a cleaner hasn't necessarily been vetted/trusted with someone's
// exact home address, and the business doesn't want liability if a full
// address is shared with the wrong person.
//
// The backend only stores a single composed address string (Google's
// formatted_address shape, e.g. "3/46 Payne Street, Auchenflower QLD 4066,
// Australia") - there's no separate suburb/postcode field to read instead -
// so this parses that string client-side.

const AU_STATE_ABBREVIATIONS = 'NSW|VIC|QLD|WA|SA|TAS|ACT|NT';

// Matches the standard Australian address tail "<Suburb> <STATE> <Postcode>",
// optionally separated by a comma (addresses are inconsistent about this,
// e.g. "Auchenflower QLD 4066" vs "Auchenflower, QLD 4066").
const SUBURB_POSTCODE_PATTERN = new RegExp(
  `([A-Za-z][A-Za-z\\s'-]*?),?\\s+(${AU_STATE_ABBREVIATIONS})\\s+(\\d{4})`,
  'i'
);

/**
 * Reduces a full street address down to "Suburb Postcode" (e.g.
 * "Auchenflower 4066"). Falls back to a best-effort guess for addresses that
 * don't match the expected Australian format, and finally to a plain
 * placeholder if nothing usable is found.
 */
export const formatSuburbPostcode = (fullAddress) => {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return 'Location not specified';
  }

  const match = fullAddress.match(SUBURB_POSTCODE_PATTERN);
  if (match) {
    const suburb = match[1].trim();
    const postcode = match[3];
    return `${suburb} ${postcode}`;
  }

  // Doesn't match "Suburb STATE Postcode" - fall back to the second-to-last
  // comma-separated segment (the last is usually the country), which is
  // still closer to "just the suburb" than the full address.
  const parts = fullAddress.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) return parts[parts.length - 2];
  return parts[0] || 'Location not specified';
};
