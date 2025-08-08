import LoginFooter from "../../shared/widgets/footer";
import LoginHeader from "../../shared/widgets/header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-50">

      <main className="flex-1 flex items-center justify-center py-4 px-4 relative">
        {/* Background network animation */}
        
        {children}
      </main>

    </div>
  );
}