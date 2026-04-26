type StatCardProps = {
  label: string;
  value: React.ReactNode;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
