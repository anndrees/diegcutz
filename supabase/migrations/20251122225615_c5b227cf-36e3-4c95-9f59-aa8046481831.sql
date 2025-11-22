-- Create ratings table for booking reviews
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
CREATE POLICY "Anyone can view ratings"
ON public.ratings
FOR SELECT
USING (true);

-- Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings"
ON public.ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
ON public.ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all ratings
CREATE POLICY "Admins can manage ratings"
ON public.ratings
FOR ALL
USING (true);

-- Create index for faster queries
CREATE INDEX idx_ratings_booking_id ON public.ratings(booking_id);
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);