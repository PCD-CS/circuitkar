import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata = {
  title: { default: "Admin", template: "%s — Circuitkar Admin" },
  robots: { index: false, follow: false },
};

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
