import { ClubForm } from "@/components/admin/club-form";

export default function NewClubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Novi klub</h1>
      <ClubForm isAdmin />
    </div>
  );
}
