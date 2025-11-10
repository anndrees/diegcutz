-- Add services and total price columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN services jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN total_price numeric(10,2) NOT NULL DEFAULT 0;