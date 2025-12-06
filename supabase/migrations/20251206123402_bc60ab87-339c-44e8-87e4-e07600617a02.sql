-- Add foreign key from ratings.user_id to profiles.id for the join to work
ALTER TABLE public.ratings 
ADD CONSTRAINT ratings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also add winner_username column to giveaways table
ALTER TABLE public.giveaways 
ADD COLUMN winner_username text;