alter table public.offer_feedback
  add column if not exists issue_dimension text,
  add column if not exists expected_product_id text,
  add column if not exists classification_version text,
  add column if not exists classification_result jsonb;

update public.offer_feedback
set issue_dimension = 'product_category'
where reason = 'wrong_category'
  and issue_dimension is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offer_feedback_issue_dimension_check'
  ) then
    alter table public.offer_feedback
      add constraint offer_feedback_issue_dimension_check
      check (
        issue_dimension is null or
        issue_dimension in ('product_category', 'filter_tag', 'source_placement', 'unsure')
      );
  end if;
end
$$;

create index if not exists offer_feedback_pending_category_idx
  on public.offer_feedback(offer_id, created_at desc)
  where reason = 'wrong_category' and status = 'pending';

comment on column public.offer_feedback.issue_dimension is
  'Distinguishes standard product classification from filter-tag and source-placement feedback.';
comment on column public.offer_feedback.expected_product_id is
  'User-selected canonical product target for product-category feedback.';
comment on column public.offer_feedback.classification_version is
  'Deterministic catalog rule version active when the feedback was submitted.';
comment on column public.offer_feedback.classification_result is
  'Classification snapshot captured when the feedback was submitted.';
