import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminProvider from "@/components/admin/AdminProvider";
import "./admin.css";

export const metadata: Metadata = {
  title: "Administração | VYNE",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
