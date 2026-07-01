const BASE_URL = 'https://api.cal.com/v1';

function getApiKey(): string {
  const key = process.env.CALCOM_API_KEY;
  if (!key) throw new Error('[calcom] Missing CALCOM_API_KEY');
  return key;
}

export type CalBooking = {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees: { email: string; name: string }[];
};

type BookingsResponse = {
  bookings: CalBooking[];
};

export async function getBookingByEmail(email: string): Promise<CalBooking | null> {
  const url = `${BASE_URL}/bookings?apiKey=${getApiKey()}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error('[calcom] getBookingByEmail failed:', res.status);
    return null;
  }

  const data = (await res.json()) as BookingsResponse;
  const match = data.bookings.find((b) =>
    b.attendees.some((a) => a.email.toLowerCase() === email.toLowerCase()),
  );

  return match ?? null;
}
