import ChatInterface from "@/components/ChatInterface";

export default function ChatPage({ params }: { params: { chatId: string } }) {
  return (
    <main className="min-h-screen bg-[#040404]">
      <ChatInterface initialChatId={params.chatId} />
    </main>
  );
}
