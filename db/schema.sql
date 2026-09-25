-- Cotizador Spacio Home: ejecutar una vez en Neon > SQL Editor.
-- Dos tablas: la cotización (con los datos del cliente tal como se emitieron)
-- y sus ambientes. Sin usuarios ni permisos: la app accede solo desde el
-- servidor con DATABASE_URL.

create table if not exists public.cotizaciones (
  id                  uuid primary key default gen_random_uuid(),
  correlativo         bigint generated always as identity unique,
  numero              text generated always as ('COT-' || lpad(correlativo::text, 6, '0')) stored,
  fecha               date not null default current_date,       -- K4
  fecha_vence         date not null default current_date,       -- K5
  cliente_nombre      text not null default '',                 -- D12
  cliente_empresa     text not null default '',                 -- D13
  cliente_documento   text not null default '',                 -- RUC / DNI (se muestra junto a la empresa)
  cliente_direccion   text not null default '',                 -- D14
  cliente_telefono    text not null default '',                 -- D15
  cliente_email       text not null default '',                 -- D16
  arquitecto_nombre   text not null default '',                 -- H12
  arquitecto_telefono text not null default '',                 -- H13
  precio_lista_m2     numeric(12,2) not null default 80,        -- T (referencia sin descuento)
  pct_adelanto        numeric(6,4) not null default 0.8,        -- J30
  pct_saldo           numeric(6,4) not null default 0.2,        -- J31
  cond_entrega        text not null default '',                 -- B29
  cond_cuota          text not null default '',                 -- B30
  cond_incluye        text not null default '',                 -- B31
  cond_entregable     text not null default '',                 -- B32
  cond_nota           text not null default '',                 -- B33
  subtotal            numeric(12,2) not null default 0,         -- K25
  igv                 numeric(12,2) not null default 0,         -- K26
  total               numeric(12,2) not null default 0,         -- K27
  monto_adelanto      numeric(12,2) not null default 0,         -- K30
  monto_saldo         numeric(12,2) not null default 0,         -- K31
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.cotizacion_items (
  id             uuid primary key default gen_random_uuid(),
  cotizacion_id  uuid not null references public.cotizaciones(id) on delete cascade,
  orden          int not null,                                  -- B (ITEMS)
  ambiente       text not null default '',                      -- C
  descripcion    text not null default '',                      -- D:G
  area           numeric(12,3) not null default 0,              -- N
  precio_m2      numeric(12,2) not null default 0,              -- O
  costo          numeric(12,2) not null default 0,              -- K = N*O
  imagen         text                                           -- H:J planta (data URL)
);

create index if not exists cotizacion_items_cotizacion_idx on public.cotizacion_items (cotizacion_id, orden);
create index if not exists cotizaciones_created_idx on public.cotizaciones (created_at desc);
