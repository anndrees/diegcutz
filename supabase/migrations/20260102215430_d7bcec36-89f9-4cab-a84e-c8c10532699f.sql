-- =============================================
-- 1. TABLA DE CONFIGURACIÓN DE LA APP
-- =============================================
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para admin (basado en el modelo existente)
CREATE POLICY "Anyone can view app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert app settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update app settings" ON public.app_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete app settings" ON public.app_settings FOR DELETE USING (true);

-- Insertar configuración por defecto para Google Auth
INSERT INTO public.app_settings (key, value) VALUES ('google_auth_enabled', 'true'::jsonb);

-- =============================================
-- 2. TABLA DE HORARIOS ESPECIALES
-- =============================================
CREATE TABLE public.special_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  is_closed boolean NOT NULL DEFAULT false,
  time_ranges jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.special_hours ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Anyone can view special hours" ON public.special_hours FOR SELECT USING (true);
CREATE POLICY "Anyone can insert special hours" ON public.special_hours FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update special hours" ON public.special_hours FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete special hours" ON public.special_hours FOR DELETE USING (true);

-- =============================================
-- 3. TABLA DE CONVERSACIONES DEL CHAT
-- =============================================
CREATE TABLE public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  unread_by_admin boolean NOT NULL DEFAULT false,
  unread_by_user boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations 
  FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert their own conversations" ON public.chat_conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
CREATE POLICY "Anyone can update conversations" ON public.chat_conversations 
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete conversations" ON public.chat_conversations 
  FOR DELETE USING (true);

-- =============================================
-- 4. TABLA DE MENSAJES DEL CHAT
-- =============================================
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages 
  FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON public.chat_messages 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON public.chat_messages 
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete messages" ON public.chat_messages 
  FOR DELETE USING (true);

-- =============================================
-- 5. HABILITAR REALTIME PARA LOS MENSAJES
-- =============================================
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;