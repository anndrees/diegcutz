import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Send, Minimize2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [adminTyping, setAdminTyping] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    setMessages((data || []).map((msg) => ({
      ...msg,
      sender_type: msg.sender_type as "user" | "admin",
    })));
  }, []);

  const markAsRead = useCallback(async (convId: string) => {
    await supabase
      .from("chat_conversations")
      .update({ unread_by_user: false })
      .eq("id", convId);

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", convId)
      .eq("sender_type", "admin");
  }, []);

  const loadOrCreateConversation = useCallback(async (userId: string) => {
    setLoading(true);

    // Buscar conversación existente (puede haber múltiples por un bug anterior, tomamos la más reciente)
    const { data: existingConvs } = await supabase
      .from("chat_conversations")
      .select("id, unread_by_user")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const existingConv = existingConvs?.[0];

    if (existingConv) {
      setConversationId(existingConv.id);
      if (existingConv.unread_by_user) {
        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", existingConv.id)
          .eq("sender_type", "admin")
          .eq("is_read", false);
        setUnreadCount(count || 0);
      }
    } else {
      const { data: newConv, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: userId })
        .select("id")
        .single();

      if (!error && newConv) {
        setConversationId(newConv.id);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadOrCreateConversation(user.id);
    }
  }, [user, loadOrCreateConversation]);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      
      // Channel for messages
      const messagesChannel = supabase
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
            setAdminTyping(false); // Stop typing indicator when message arrives
            
            if (newMsg.sender_type === "admin" && !isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            // Reload messages when any are deleted (e.g., when history is cleared)
            loadMessages(conversationId);
          }
        )
        .subscribe();

      // Channel for typing indicator (using presence)
      const typingChannel = supabase
        .channel(`typing-${conversationId}`)
        .on("presence", { event: "sync" }, () => {
          const state = typingChannel.presenceState();
          const adminIsTyping = Object.values(state).some((presences: any) =>
            presences.some((p: any) => p.role === "admin" && p.typing)
          );
          setAdminTyping(adminIsTyping);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
      };
    }
  }, [conversationId, isOpen, loadMessages]);

  useEffect(() => {
    if (isOpen && conversationId) {
      markAsRead(conversationId);
      setUnreadCount(0);
    }
  }, [isOpen, conversationId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Don't render if user is not logged in
  if (!user || !profile) return null;

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

  const clearChatHistory = async () => {
    if (!conversationId) return;

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("conversation_id", conversationId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar el historial",
        variant: "destructive",
      });
      return;
    }

    setMessages([]);
    setClearDialogOpen(false);
    toast({
      title: "Historial limpiado",
      description: "Se han eliminado todos los mensajes",
    });
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
            <p className="text-xs text-white/80">
              {adminTyping ? "Escribiendo..." : "Te responderemos pronto"}
            </p>
          </div>
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setClearDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar historial
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              {adminTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
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

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Limpiar historial"
        description="¿Estás seguro de que quieres eliminar todos los mensajes? Esta acción no se puede deshacer."
        confirmText="Limpiar"
        cancelText="Cancelar"
        onConfirm={clearChatHistory}
        variant="destructive"
      />
    </>
  );
};
