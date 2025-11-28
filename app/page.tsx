import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Fingenie</h1>
          <AuthButton />
        </header>
        
        <main className="text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to Fingenie
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Your financial genie is here to help you manage your money, track expenses, 
              and make smart financial decisions. Sign in with Google to get started.
            </p>
            
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Get Started Today
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in to access your personalized financial dashboard and start 
                taking control of your finances.
              </p>
              <AuthButton />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
