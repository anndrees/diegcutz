-- Add is_archived column to chat_conversations
ALTER TABLE public.chat_conversations 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;