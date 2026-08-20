begin;

create table if not exists public.products (
  id text primary key,
  name text not null,
  model text not null default '',
  brand text not null,
  description text not null default '',
  price_cents bigint not null check (price_cents >= 0),
  promotional_price_cents bigint check (promotional_price_cents is null or promotional_price_cents >= 0),
  image_url text not null,
  stock integer not null default 0 check (stock >= 0),
  category text not null default 'Relógios',
  tag text not null default '',
  specs_json jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  recommended boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales (
  id text primary key,
  total_cents bigint not null check (total_cents >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'CANCELED')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz
);

create table if not exists public.sale_items (
  id text primary key,
  sale_id text not null references public.sales(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  total_cents bigint not null check (total_cents >= 0)
);

create table if not exists public.stock_movements (
  id text primary key,
  product_id text not null references public.products(id),
  sale_id text references public.sales(id),
  type text not null check (type in ('ENTRY', 'SALE', 'MANUAL_ADJUSTMENT', 'RETURN', 'CANCELLATION')),
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null check (new_stock >= 0),
  responsible text not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_brand on public.products(brand);
create index if not exists idx_products_active_stock on public.products(active, stock);
create index if not exists idx_sales_status_confirmed_at on public.sales(status, confirmed_at);
create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items(product_id);
create index if not exists idx_stock_movements_product_created on public.stock_movements(product_id, created_at desc);
create index if not exists idx_stock_movements_created_at on public.stock_movements(created_at desc);

alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;

revoke all on public.products, public.sales, public.sale_items, public.stock_movements from anon, authenticated;
grant usage on schema public to service_role;
grant all on public.products, public.sales, public.sale_items, public.stock_movements to service_role;

create or replace function public.vyne_create_product(
  p_id text,
  p_payload jsonb,
  p_responsible text
) returns setof public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  initial_stock integer := coalesce((p_payload->>'stock')::integer, 0);
  created_at_value timestamptz := timezone('utc', now());
begin
  insert into public.products (
    id, name, model, brand, description, price_cents, promotional_price_cents,
    image_url, stock, category, tag, specs_json, featured, recommended, active,
    created_at, updated_at
  ) values (
    p_id,
    p_payload->>'name',
    coalesce(p_payload->>'model', ''),
    p_payload->>'brand',
    coalesce(p_payload->>'description', ''),
    (p_payload->>'price_cents')::bigint,
    (p_payload->>'promotional_price_cents')::bigint,
    p_payload->>'image_url',
    initial_stock,
    coalesce(nullif(p_payload->>'category', ''), 'Relógios'),
    coalesce(p_payload->>'tag', ''),
    coalesce(p_payload->'specs_json', '[]'::jsonb),
    coalesce((p_payload->>'featured')::boolean, false),
    coalesce((p_payload->>'recommended')::boolean, false),
    coalesce((p_payload->>'active')::boolean, true),
    created_at_value,
    created_at_value
  );

  if initial_stock > 0 then
    insert into public.stock_movements (
      id, product_id, sale_id, type, quantity, previous_stock, new_stock,
      responsible, note, created_at
    ) values (
      gen_random_uuid()::text, p_id, null, 'ENTRY', initial_stock, 0, initial_stock,
      p_responsible, 'Estoque inicial do produto', created_at_value
    );
  end if;

  return query select * from public.products where id = p_id;
end;
$$;

create or replace function public.vyne_update_product(
  p_id text,
  p_payload jsonb,
  p_responsible text
) returns setof public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_stock integer;
  next_stock integer := coalesce((p_payload->>'stock')::integer, 0);
  updated_at_value timestamptz := timezone('utc', now());
begin
  select stock into previous_stock from public.products where id = p_id for update;
  if not found then
    return;
  end if;

  update public.products set
    name = p_payload->>'name',
    model = coalesce(p_payload->>'model', ''),
    brand = p_payload->>'brand',
    description = coalesce(p_payload->>'description', ''),
    price_cents = (p_payload->>'price_cents')::bigint,
    promotional_price_cents = (p_payload->>'promotional_price_cents')::bigint,
    image_url = p_payload->>'image_url',
    stock = next_stock,
    category = coalesce(nullif(p_payload->>'category', ''), 'Relógios'),
    tag = coalesce(p_payload->>'tag', ''),
    specs_json = coalesce(p_payload->'specs_json', '[]'::jsonb),
    featured = coalesce((p_payload->>'featured')::boolean, false),
    recommended = coalesce((p_payload->>'recommended')::boolean, false),
    active = coalesce((p_payload->>'active')::boolean, true),
    updated_at = updated_at_value
  where id = p_id;

  if next_stock <> previous_stock then
    insert into public.stock_movements (
      id, product_id, sale_id, type, quantity, previous_stock, new_stock,
      responsible, note, created_at
    ) values (
      gen_random_uuid()::text, p_id, null, 'MANUAL_ADJUSTMENT',
      next_stock - previous_stock, previous_stock, next_stock, p_responsible,
      'Ajuste realizado na edição do produto', updated_at_value
    );
  end if;

  return query select * from public.products where id = p_id;
end;
$$;

create or replace function public.vyne_delete_product(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reference_count bigint;
  product_value jsonb;
begin
  select to_jsonb(p) into product_value from public.products p where p.id = p_id for update;
  if product_value is null then
    return null;
  end if;

  select
    (select count(*) from public.sale_items where product_id = p_id) +
    (select count(*) from public.stock_movements where product_id = p_id)
  into reference_count;

  if reference_count > 0 then
    update public.products
      set active = false, recommended = false, featured = false,
          updated_at = timezone('utc', now())
      where id = p_id;
    select to_jsonb(p) into product_value from public.products p where p.id = p_id;
    return jsonb_build_object('mode', 'archived', 'product', product_value);
  end if;

  delete from public.products where id = p_id;
  return jsonb_build_object('mode', 'deleted', 'product', product_value);
end;
$$;

create or replace function public.vyne_adjust_stock(
  p_product_id text,
  p_type text,
  p_quantity integer,
  p_responsible text,
  p_note text
) returns setof public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_stock integer;
  next_stock integer;
  updated_at_value timestamptz := timezone('utc', now());
begin
  if p_type not in ('ENTRY', 'MANUAL_ADJUSTMENT', 'RETURN') then
    raise exception 'Tipo de movimentação inválido.';
  end if;
  if p_quantity = 0 then
    raise exception 'A quantidade deve ser diferente de zero.';
  end if;

  select stock into previous_stock from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Produto não encontrado.';
  end if;
  next_stock := previous_stock + p_quantity;
  if next_stock < 0 then
    raise exception 'A movimentação deixaria o estoque negativo.';
  end if;

  update public.products set stock = next_stock, updated_at = updated_at_value where id = p_product_id;
  insert into public.stock_movements (
    id, product_id, sale_id, type, quantity, previous_stock, new_stock,
    responsible, note, created_at
  ) values (
    gen_random_uuid()::text, p_product_id, null, p_type, p_quantity,
    previous_stock, next_stock, p_responsible, coalesce(p_note, ''), updated_at_value
  );

  return query select * from public.products where id = p_product_id;
end;
$$;

create or replace function public.vyne_create_sale(p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  sale_id_value text := gen_random_uuid()::text;
  sale_total bigint := 0;
  item_count integer := 0;
  item record;
  product_value public.products%rowtype;
  unit_price bigint;
  created_at_value timestamptz := timezone('utc', now());
begin
  insert into public.sales (id, total_cents, status, created_at, updated_at)
  values (sale_id_value, 0, 'PENDING', created_at_value, created_at_value);

  for item in
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as entry(product_id text, quantity integer)
    group by product_id
  loop
    item_count := item_count + 1;
    if item.quantity <= 0 then
      raise exception 'A quantidade deve ser maior que zero.';
    end if;

    select * into product_value
      from public.products where id = item.product_id and active = true;
    if not found then
      raise exception 'Um dos produtos não está disponível.';
    end if;

    unit_price := coalesce(product_value.promotional_price_cents, product_value.price_cents);
    insert into public.sale_items (
      id, sale_id, product_id, product_name, quantity, unit_price_cents, total_cents
    ) values (
      gen_random_uuid()::text, sale_id_value, product_value.id,
      concat(product_value.brand, ' ', product_value.name), item.quantity,
      unit_price, unit_price * item.quantity
    );
    sale_total := sale_total + (unit_price * item.quantity);
  end loop;

  if item_count = 0 then
    raise exception 'Adicione ao menos um produto à venda.';
  end if;

  update public.sales set total_cents = sale_total where id = sale_id_value;
  return sale_id_value;
end;
$$;

create or replace function public.vyne_update_sale_status(
  p_sale_id text,
  p_requested_status text,
  p_responsible text
) returns setof public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  item record;
  previous_stock integer;
  updated_at_value timestamptz := timezone('utc', now());
begin
  select status into current_status from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'Venda não encontrada.';
  end if;
  if current_status = p_requested_status then
    return query select * from public.sales where id = p_sale_id;
    return;
  end if;

  if p_requested_status = 'CONFIRMED' then
    if current_status <> 'PENDING' then
      raise exception 'Somente vendas pendentes podem ser confirmadas.';
    end if;
    for item in select * from public.sale_items where sale_id = p_sale_id order by id loop
      select stock into previous_stock from public.products where id = item.product_id for update;
      if previous_stock < item.quantity then
        raise exception 'Estoque insuficiente para confirmar esta venda.';
      end if;
      update public.products
        set stock = previous_stock - item.quantity, updated_at = updated_at_value
        where id = item.product_id;
      insert into public.stock_movements (
        id, product_id, sale_id, type, quantity, previous_stock, new_stock,
        responsible, note, created_at
      ) values (
        gen_random_uuid()::text, item.product_id, p_sale_id, 'SALE', -item.quantity,
        previous_stock, previous_stock - item.quantity, p_responsible,
        'Venda confirmada', updated_at_value
      );
    end loop;
    update public.sales set status = 'CONFIRMED', confirmed_at = updated_at_value,
      updated_at = updated_at_value where id = p_sale_id;
  elsif p_requested_status = 'CANCELED' and current_status = 'CONFIRMED' then
    for item in select * from public.sale_items where sale_id = p_sale_id order by id loop
      select stock into previous_stock from public.products where id = item.product_id for update;
      update public.products
        set stock = previous_stock + item.quantity, updated_at = updated_at_value
        where id = item.product_id;
      insert into public.stock_movements (
        id, product_id, sale_id, type, quantity, previous_stock, new_stock,
        responsible, note, created_at
      ) values (
        gen_random_uuid()::text, item.product_id, p_sale_id, 'CANCELLATION', item.quantity,
        previous_stock, previous_stock + item.quantity, p_responsible,
        'Venda cancelada', updated_at_value
      );
    end loop;
    update public.sales set status = 'CANCELED', updated_at = updated_at_value where id = p_sale_id;
  elsif p_requested_status = 'CANCELED' and current_status = 'PENDING' then
    update public.sales set status = 'CANCELED', updated_at = updated_at_value where id = p_sale_id;
  else
    raise exception 'Alteração de status inválida.';
  end if;

  return query select * from public.sales where id = p_sale_id;
end;
$$;

revoke all on function public.vyne_create_product(text, jsonb, text) from public, anon, authenticated;
revoke all on function public.vyne_update_product(text, jsonb, text) from public, anon, authenticated;
revoke all on function public.vyne_delete_product(text) from public, anon, authenticated;
revoke all on function public.vyne_adjust_stock(text, text, integer, text, text) from public, anon, authenticated;
revoke all on function public.vyne_create_sale(jsonb) from public, anon, authenticated;
revoke all on function public.vyne_update_sale_status(text, text, text) from public, anon, authenticated;
grant execute on function public.vyne_create_product(text, jsonb, text) to service_role;
grant execute on function public.vyne_update_product(text, jsonb, text) to service_role;
grant execute on function public.vyne_delete_product(text) to service_role;
grant execute on function public.vyne_adjust_stock(text, text, integer, text, text) to service_role;
grant execute on function public.vyne_create_sale(jsonb) to service_role;
grant execute on function public.vyne_update_sale_status(text, text, text) to service_role;

insert into public.products (
  id, name, model, brand, description, price_cents, promotional_price_cents,
  image_url, stock, category, tag, specs_json, featured, recommended, active
) values
  ('seiko-5-sports', 'Seiko 5 Sports', '5 Sports', 'SEIKO', 'Automático · presença esportiva', 249000, null, '/media/products/seiko-5-sports-v2.jpg', 0, 'Automático', 'Escolha do curador', '["Movimento automático","Caixa em aço","Estilo versátil"]'::jsonb, true, true, true),
  ('casio-vintage', 'Casio Vintage', 'Vintage', 'CASIO', 'Digital · design que atravessa gerações', 34900, null, '/media/products/casio-vintage-v2.jpg', 0, 'Digital', 'Ícone acessível', '["Display digital","Bracelete metálico","Perfil urbano"]'::jsonb, true, true, true),
  ('citizen-tsuyosa', 'Citizen Tsuyosa', 'Tsuyosa', 'CITIZEN', 'Automático · cor e precisão', 279000, null, '/media/products/citizen-tsuyosa-v2.jpg', 0, 'Automático', 'Novo ritmo', '["Movimento automático","Mostrador marcante","Aço integrado"]'::jsonb, true, true, true),
  ('orient-bambino', 'Orient Bambino', 'Bambino', 'ORIENT', 'Automático · elegância sem excesso', 189000, null, '/media/products/orient-bambino-v2.jpg', 0, 'Automático', 'Essencial clássico', '["Estética clássica","Perfil refinado","Uso social"]'::jsonb, false, true, true),
  ('timex-q-reissue', 'Timex Q Reissue', 'Q Reissue', 'TIMEX', 'Quartzo · herança reinterpretada', 129000, null, '/media/products/timex-q-reissue-v2.jpg', 0, 'Quartzo', 'Design de arquivo', '["Movimento a quartzo","Caixa em aço","Visual atemporal"]'::jsonb, false, true, true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "VYNE public product image read" on storage.objects;
create policy "VYNE public product image read"
  on storage.objects for select to public
  using (bucket_id = 'product-images');

commit;
