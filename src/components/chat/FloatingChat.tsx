import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  conversation_id: string;
  sender_type: "user" | "admin";
  message: string;
  is_read: boolean;
  created_at: string;
};

export const FloatingChat = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadOrCreateConversation();
    }
  }, [user]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`user-chat-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
            
            if (newMsg.sender_type === "admin" && !isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, isOpen]);

  useEffect(() => {
    if (isOpen && conversationId) {
      markAsRead();
      setUnreadCount(0);
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Don't render if user is not logged in
  if (!user || !profile) return null;

  const loadOrCreateConversation = async () => {
    if (!user) return;

    setLoading(true);

    // Check if conversation exists
    const { data: existingConv } = await supabase
      .from("chat_conversations")
      .select("id, unread_by_user")
      .eq("user_id", user.id)
      .single();

    if (existingConv) {
      setConversationId(existingConv.id);
      if (existingConv.unread_by_user) {
        // Count unread messages
        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", existingConv.id)
          .eq("sender_type", "admin")
          .eq("is_read", false);
        setUnreadCount(count || 0);
      }
    } else {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id })
        .select("id")
        .single();

      if (!error && newConv) {
        setConversationId(newConv.id);
      }
    }

    setLoading(false);
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages((data || []).map((msg) => ({
      ...msg,
      sender_type: msg.sender_type as "user" | "admin",
    })));
  };

  const markAsRead = async () => {
    if (!conversationId) return;

    await supabase
      .from("chat_conversations")
      .update({ unread_by_user: false })
      .eq("id", conversationId);

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "admin");
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    setSending(true);

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_type: "user",
      message: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      setSending(false);
      return;
    }

    // Update conversation
    await supabase
      .from("chat_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        unread_by_admin: true,
      })
      .eq("id", conversationId);

    setNewMessage("");
    setSending(false);
  };

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-neon-purple text-white shadow-lg transition-all hover:scale-110 flex items-center justify-center",
          isOpen && "hidden"
        )}
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-neon-cyan text-background text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden",
          isOpen
            ? "opacity-100 translate-y-0 h-[500px] max-h-[70vh]"
            : "opacity-0 translate-y-4 h-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-neon-purple p-4 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="font-bold">Chat con DIEGCUTZ</h3>
            <p className="text-xs text-white/80">Te responderemos pronto</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">¡Hola! ¿En qué podemos ayudarte?</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender_type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2",
                      msg.sender_type === "user"
                        ? "bg-neon-purple text-white rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        msg.sender_type === "user"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} variant="neon" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
