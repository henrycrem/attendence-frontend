import LoginFooter from "../../shared/widgets/footer";
import LoginHeader from "../../shared/widgets/header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-red-800">
      <LoginHeader />
      <main className="flex-1 flex items-center justify-center py-8 px-4 relative">
        {/* Background network animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400/20 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-red-500/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-red-300/20 rounded-full animate-bounce"></div>
        </div>
        {children}
      </main>
      <LoginFooter />
    </div>
  );
}