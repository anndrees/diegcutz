import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Send, ArrowLeft, User, Archive, Trash2, ArchiveRestore, ChevronDown, ChevronRight, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { sendChatMessageNotification } from "@/lib/pushNotifications";

type Conversation = {
  id: string;
  user_id: string;
  last_message_at: string;
  unread_by_admin: boolean;
  is_archived: boolean;
  profile?: {
    full_name: string;
    username: string;
  };
  last_message?: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_type: "user" | "admin";
  message: string;
  is_read: boolean;
  created_at: string;
};

export const AdminMessagesSection = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversations = conversations.filter((c) => !c.is_archived);
  const archivedConversations = conversations.filter((c) => c.is_archived);

  useEffect(() => {
    loadConversations();

    // Subscribe to real-time updates for conversations
    const conversationsChannel = supabase
      .channel("admin-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);

      // Subscribe to real-time messages
      const messagesChannel = supabase
        .channel(`admin-messages-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.sender_type === "user") {
              markAsRead(selectedConversation.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select(`
        *,
        profile:profiles!chat_conversations_user_id_fkey(full_name, username)
      `)
      .order("last_message_at", { ascending: false });

    setLoading(false);

    if (error) {
      // If the error is about the foreign key, try without the join
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (fallbackError) {
        console.error("Error loading conversations:", fallbackError);
        return;
      }

      // Load profiles separately
      const conversationsWithProfiles = await Promise.all(
        (fallbackData || []).map(async (conv) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", conv.user_id)
            .single();

          // Get last message
          const { data: lastMsgData } = await supabase
            .from("chat_messages")
            .select("message")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            is_archived: conv.is_archived ?? false,
            profile: profileData
              ? { full_name: profileData.full_name, username: profileData.username }
              : undefined,
            last_message: lastMsgData?.message,
          };
        })
      );

      setConversations(conversationsWithProfiles);
      return;
    }

    // Load last messages for each conversation
    const conversationsWithLastMessage = await Promise.all(
      (data || []).map(async (conv) => {
        const { data: lastMsgData } = await supabase
          .from("chat_messages")
          .select("message")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          is_archived: conv.is_archived ?? false,
          profile: Array.isArray(conv.profile) ? conv.profile[0] : conv.profile,
          last_message: lastMsgData?.message,
        };
      })
    );

    setConversations(conversationsWithLastMessage);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages((data || []).map((msg) => ({
      ...msg,
      sender_type: msg.sender_type as "user" | "admin",
    })));
  };

  const markAsRead = async (conversationId: string) => {
    await supabase
      .from("chat_conversations")
      .update({ unread_by_admin: false })
      .eq("id", conversationId);

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "user");
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedConversation || !typingChannelRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      typingChannelRef.current.track({ role: "admin", typing: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingChannelRef.current?.track({ role: "admin", typing: false });
    }, 2000);
  };

  // Setup typing channel when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      typingChannelRef.current = supabase.channel(`typing-${selectedConversation.id}`);
      typingChannelRef.current.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await typingChannelRef.current?.track({ role: "admin", typing: false });
        }
      });

      return () => {
        if (typingChannelRef.current) {
          supabase.removeChannel(typingChannelRef.current);
          typingChannelRef.current = null;
        }
      };
    }
  }, [selectedConversation]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    setIsTyping(false);
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingChannelRef.current?.track({ role: "admin", typing: false });

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: selectedConversation.id,
      sender_type: "admin",
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
        unread_by_user: true,
      })
      .eq("id", selectedConversation.id);

    // Send push notification to user
    try {
      await sendChatMessageNotification(selectedConversation.user_id, newMessage.trim());
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
    }

    setNewMessage("");
    setSending(false);
  };

  const clearChatHistory = async () => {
    if (!selectedConversation) return;

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("conversation_id", selectedConversation.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar el historial",
        variant: "destructive",
      });
      return;
    }

    setMessages([]);
    setClearHistoryDialogOpen(false);
    toast({
      title: "Historial limpiado",
      description: "Se han eliminado todos los mensajes de esta conversación",
    });
  };

  const archiveConversation = async (conv: Conversation) => {
    const { error } = await supabase
      .from("chat_conversations")
      .update({ is_archived: !conv.is_archived })
      .eq("id", conv.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo archivar la conversación",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: conv.is_archived ? "Conversación restaurada" : "Conversación archivada",
      description: conv.is_archived 
        ? "La conversación ha sido restaurada" 
        : "La conversación ha sido archivada",
    });

    if (selectedConversation?.id === conv.id) {
      setSelectedConversation(null);
    }
  };

  const handleDeleteClick = (conv: Conversation) => {
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const deleteConversation = async () => {
    if (!conversationToDelete) return;

    // Delete all messages
    const { error: messagesError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("conversation_id", conversationToDelete.id);

    if (messagesError) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los mensajes",
        variant: "destructive",
      });
      return;
    }

    // Delete the conversation itself
    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conversación eliminada",
      description: "La conversación ha sido eliminada permanentemente",
    });

    if (selectedConversation?.id === conversationToDelete.id) {
      setSelectedConversation(null);
    }

    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const unreadCount = activeConversations.filter((c) => c.unread_by_admin).length;

  const ConversationItem = ({ conv }: { conv: Conversation }) => (
    <div
      className={cn(
        "group relative w-full text-left p-4 hover:bg-muted/50 transition-colors",
        selectedConversation?.id === conv.id && "bg-muted",
        conv.unread_by_admin && "bg-neon-cyan/5"
      )}
    >
      <button
        onClick={() => setSelectedConversation(conv)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0 pr-16">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold truncate">
                {conv.profile?.full_name || "Usuario"}
              </p>
              {conv.unread_by_admin && (
                <span className="w-2 h-2 rounded-full bg-neon-cyan shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              @{conv.profile?.username || "unknown"}
            </p>
            {conv.last_message && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {conv.last_message}
              </p>
            )}
          </div>
        </div>
      </button>
      
      {/* Action buttons */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            archiveConversation(conv);
          }}
          title={conv.is_archived ? "Restaurar" : "Archivar"}
        >
          {conv.is_archived ? (
            <ArchiveRestore className="h-4 w-4 text-neon-cyan" />
          ) : (
            <Archive className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(conv);
          }}
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-20rem)]">
        {/* Conversations list */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-neon-cyan" />
              Conversaciones
              {unreadCount > 0 && (
                <span className="ml-auto bg-neon-cyan text-background text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando...</p>
              ) : conversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay conversaciones
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {/* Archived folder */}
                  {archivedConversations.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-muted-foreground"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Archive className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-foreground">Archivados</p>
                          <p className="text-xs">{archivedConversations.length} conversaciones</p>
                        </div>
                        {showArchived ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {showArchived && (
                        <div className="bg-muted/30">
                          {archivedConversations.map((conv) => (
                            <ConversationItem key={conv.id} conv={conv} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Active conversations */}
                  {activeConversations.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="bg-card border-border lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-neon-purple" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {selectedConversation.profile?.full_name || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{selectedConversation.profile?.username || "unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => archiveConversation(selectedConversation)}
                      title={selectedConversation.is_archived ? "Restaurar" : "Archivar"}
                    >
                      {selectedConversation.is_archived ? (
                        <ArchiveRestore className="h-4 w-4 text-neon-cyan" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setClearHistoryDialogOpen(true)}
                      title="Limpiar historial"
                    >
                      <Eraser className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(selectedConversation)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Link to={`/admin/client/${selectedConversation.user_id}`}>
                      <Button variant="outline" size="sm">
                        Ver perfil
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4 h-[300px]">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.sender_type === "admin" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2",
                            msg.sender_type === "admin"
                              ? "bg-neon-purple text-white rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              msg.sender_type === "admin"
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
                </ScrollArea>

                <form onSubmit={sendMessage} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Escribe un mensaje..."
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()} variant="neon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una conversación para ver los mensajes</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar conversación"
        description={`¿Estás seguro de que quieres eliminar la conversación con ${conversationToDelete?.profile?.full_name || "este usuario"}? Esta acción eliminará todos los mensajes y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={deleteConversation}
        variant="destructive"
      />

      <ConfirmDialog
        open={clearHistoryDialogOpen}
        onOpenChange={setClearHistoryDialogOpen}
        title="Limpiar historial"
        description={`¿Estás seguro de que quieres eliminar todos los mensajes de esta conversación? La conversación se mantendrá pero sin historial.`}
        confirmText="Limpiar"
        cancelText="Cancelar"
        onConfirm={clearChatHistory}
        variant="destructive"
      />
    </>
  );
};
