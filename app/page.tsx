import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageSquare className="h-12 w-12 text-zinc-300" />
            <h1 className="text-4xl font-bold">WhatsApp</h1>
          </div>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Send bulk WhatsApp messages easily with our multi-user platform. Connect your WhatsApp account and start messaging.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* <Card className="p-6 bg-black border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Get Started</h2>
            <p className="text-zinc-400 mb-6">
              Create an account to start sending bulk WhatsApp messages. Connect your WhatsApp account and manage your messaging campaigns.
            </p>
            <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700">
              <a href="/register">Register Now</a>
            </Button>
          </Card> */}

          <Card className="p-6 bg-black border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Already a User?</h2>
            <p className="text-zinc-400 mb-6">
              Login to your account to continue sending messages and managing your WhatsApp connections.
            </p>
            <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700">
              <a href="/login ">Login</a>
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}