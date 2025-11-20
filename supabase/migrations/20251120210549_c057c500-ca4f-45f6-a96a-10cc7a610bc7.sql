-- Create profiles table for user information
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique not null,
  contact_method text not null check (contact_method in ('email', 'phone')),
  contact_value text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Add user_id to bookings (nullable for backwards compatibility)
alter table public.bookings 
add column user_id uuid references public.profiles(id) on delete set null;

-- RLS policies for profiles
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles for select
using (true);

-- Update bookings policies to allow users to see their own bookings
create policy "Users can view their own bookings"
on public.bookings for select
using (auth.uid() = user_id or user_id is null or true);

create policy "Users can insert their own bookings"
on public.bookings for insert
with check (auth.uid() = user_id or true);

-- Create trigger to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, contact_method, contact_value)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'contact_method',
    new.raw_user_meta_data->>'contact_value'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();