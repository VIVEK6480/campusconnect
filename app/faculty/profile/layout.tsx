import FacultyLayout from "@/app/dashboard/faculty/layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FacultyLayout>{children}</FacultyLayout>;
}