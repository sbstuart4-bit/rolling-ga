export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#121212] px-5 py-12">
      {children}
    </div>
  );
}
