-- Add email verification support

-- Add email_verified column to profiles if it doesn't exist
alter table profiles 
add column if not exists email_verified boolean not null default false;

-- Create email verification tokens table
create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null default now() + interval '1 hour',
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create index for faster lookups
create index if not exists idx_email_verification_tokens_token on email_verification_tokens(token);
create index if not exists idx_email_verification_tokens_user_id on email_verification_tokens(user_id);
