alter table public.stream_profiles add column if not exists stripe_payment_link_url text;

update public.stream_profiles
set stripe_payment_link_url = 'https://donate.stripe.com/test_5kQ7sN93VdB9dW21SY9ws00'
where username = 'dominik-demo';
