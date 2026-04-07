import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingsList } from "./bookings-list";

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, date, start_time, end_time, duration_minutes, total_price,
      status, payment_status, created_at,
      clubs(name, slug),
      courts(name, sport_type)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">
          Moje rezervacije
        </h1>
        <BookingsList bookings={bookings ?? []} />
      </div>
    </main>
  );
}
