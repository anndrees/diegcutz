
-- Step 1: Move all messages from duplicate conversations to the "keeper" (most recent one per user)
-- For each user, the keeper is the conversation with the latest last_message_at

-- First, update messages from duplicate conversations to point to the keeper
WITH keeper AS (
  SELECT DISTINCT ON (user_id) id as keep_id, user_id
  FROM chat_conversations
  ORDER BY user_id, last_message_at DESC
),
duplicates AS (
  SELECT c.id as dup_id, k.keep_id
  FROM chat_conversations c
  JOIN keeper k ON c.user_id = k.user_id
  WHERE c.id != k.keep_id
)
UPDATE chat_messages
SET conversation_id = d.keep_id
FROM duplicates d
WHERE chat_messages.conversation_id = d.dup_id;

-- Step 2: Delete the duplicate conversations (now empty of messages)
WITH keeper AS (
  SELECT DISTINCT ON (user_id) id as keep_id, user_id
  FROM chat_conversations
  ORDER BY user_id, last_message_at DESC
)
DELETE FROM chat_conversations c
WHERE EXISTS (
  SELECT 1 FROM keeper k
  WHERE c.user_id = k.user_id AND c.id != k.keep_id
);

-- Step 3: Add unique constraint on user_id to prevent future duplicates
ALTER TABLE chat_conversations ADD CONSTRAINT chat_conversations_user_id_unique UNIQUE (user_id);
