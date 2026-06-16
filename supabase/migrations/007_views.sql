-- Migration 007: Analytics Views
-- security_invoker = true so views run with the querying user's RLS,
-- not the view owner's — staff only see rows for their own restaurant.

create view public.v_most_ordered_items with (security_invoker = true) as
select
  o.restaurant_id,
  oi.menu_item_id,
  mi.name,
  sum(oi.quantity)          as total_quantity,
  count(distinct oi.order_id) as order_count
from public.order_items oi
join public.orders     o  on o.id  = oi.order_id
join public.menu_items mi on mi.id = oi.menu_item_id
where oi.is_removed = false
group by o.restaurant_id, oi.menu_item_id, mi.name;

create view public.v_video_analytics with (security_invoker = true) as
select
  restaurant_id,
  menu_item_id,
  count(*) filter (where event_type = 'video_view')  as views,
  count(*) filter (where event_type = 'add_to_cart') as add_to_cart,
  count(*) filter (where event_type = 'order_placed') as orders,
  case
    when count(*) filter (where event_type = 'video_view') > 0
    then round(
      100.0 * count(*) filter (where event_type = 'order_placed')
            / count(*) filter (where event_type = 'video_view'), 1)
    else 0
  end as conversion_rate_pct
from public.video_analytics_events
group by restaurant_id, menu_item_id;

create view public.v_recommendation_effectiveness with (security_invoker = true) as
select
  restaurant_id,
  placement,
  count(*) filter (where event_type = 'shown')        as shown,
  count(*) filter (where event_type = 'item_tapped')  as item_tapped,
  count(*) filter (where event_type = 'added_to_cart') as added_to_cart,
  case
    when count(*) filter (where event_type = 'shown') > 0
    then round(
      100.0 * count(*) filter (where event_type = 'added_to_cart')
            / count(*) filter (where event_type = 'shown'), 1)
    else 0
  end as conversion_rate_pct
from public.recommendation_events
group by restaurant_id, placement;
