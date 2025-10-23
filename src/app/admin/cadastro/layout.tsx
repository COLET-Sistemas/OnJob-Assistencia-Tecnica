import CadastroPermissionBoundary from "@/components/admin/common/CadastroPermissionBoundary";

export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CadastroPermissionBoundary>{children}</CadastroPermissionBoundary>;
}

