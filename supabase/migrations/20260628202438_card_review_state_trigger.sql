-- Auto-create a card_review_state row for every card, mirroring the
-- handle_new_user trigger pattern in 20260627234219_init_schema.sql. See
-- ADR-0023: app code never has to remember to create this row, so it can
-- never drift out of sync with `cards`.

create function public.handle_new_card()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.card_review_state (card_id, user_id) values (new.id, new.user_id);
  return new;
end;
$$;

create trigger on_card_created
  after insert on public.cards
  for each row execute function public.handle_new_card();

-- Backfill: any card inserted before this trigger existed gets a default
-- ('new', due now) review-state row too, so the study queue never silently
-- skips an older card.
insert into public.card_review_state (card_id, user_id)
select cards.id, cards.user_id
from public.cards
where not exists (
  select 1 from public.card_review_state where card_review_state.card_id = cards.id
);
