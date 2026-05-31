-- Add 'follow' to the notifications type check constraint
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('like', 'comment', 'rating', 'reply', 'follow'));
