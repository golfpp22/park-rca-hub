
create type public.app_role as enum ('admin','executive','operator','technician');
create type public.severity_level as enum ('low','medium','high','critical');
create type public.incident_status as enum ('open','assigned','in_progress','waiting_parts','resolved','closed');
create type public.check_status as enum ('ok','problem','note');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text unique not null,
  full_name text not null default '',
  phone text,
  position text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id)
$$;
create or replace function public.is_manager(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role in ('admin','operator','executive'))
$$;

create policy "staff read profiles" on public.profiles for select to authenticated using (public.is_staff(auth.uid()) or id = auth.uid());
create policy "self update profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "admin manage profiles" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "staff read roles" on public.user_roles for select to authenticated using (public.is_staff(auth.uid()) or user_id = auth.uid());

-- Sites (gates)
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  code int not null unique,
  name text not null,
  direction text not null default 'ทางเข้า',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  type text not null,
  asset_code text,
  status text not null default 'online',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  equipment_type text not null,
  item text not null,
  sort_order int not null default 0
);
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  inspector_id uuid not null,
  inspection_date date not null default current_date,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique(site_id, inspection_date)
);
create table public.inspection_results (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  status check_status not null,
  checks jsonb not null default '[]',
  problem_type text,
  note text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(inspection_id, equipment_id)
);
create sequence public.incident_seq;
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('INC-' || lpad(nextval('public.incident_seq')::text, 4, '0')),
  site_id uuid references public.sites(id) on delete set null,
  equipment_id uuid references public.equipment(id) on delete set null,
  title text not null,
  category text not null default 'อื่นๆ',
  severity severity_level not null default 'medium',
  status incident_status not null default 'open',
  description text,
  root_cause text,
  resolution text,
  parts_used text,
  photos text[] not null default '{}',
  after_photos text[] not null default '{}',
  reporter_id uuid,
  assignee_id uuid,
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  started_at timestamptz,
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.incident_logs (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  actor_id uuid,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete set null,
  plate text not null,
  discount_type text not null default 'ร้านค้า',
  amount numeric(10,2) not null default 0,
  reason text,
  recorded_by uuid,
  created_at timestamptz not null default now()
);
create table public.parking_hourly (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  stat_date date not null,
  hour int not null,
  entries int not null default 0,
  exits int not null default 0,
  revenue numeric(12,2) not null default 0,
  pay_qr numeric(12,2) not null default 0,
  pay_kiosk numeric(12,2) not null default 0,
  pay_exit numeric(12,2) not null default 0,
  unique(site_id, stat_date, hour)
);

do $$ declare t text; begin
  foreach t in array array['sites','equipment','checklist_templates','inspections','inspection_results','incidents','incident_logs','discounts','parking_hourly'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "staff read %s" on public.%I for select to authenticated using (public.is_staff(auth.uid()))', t, t);
  end loop;
end $$;
grant usage on sequence public.incident_seq to authenticated;

create policy "admin write sites" on public.sites for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin write equipment" on public.equipment for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "staff update equipment status" on public.equipment for update to authenticated using (public.is_staff(auth.uid()));
create policy "admin write checklist" on public.checklist_templates for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "staff insert inspections" on public.inspections for insert to authenticated with check (inspector_id = auth.uid() and public.is_staff(auth.uid()));
create policy "staff update inspections" on public.inspections for update to authenticated using (inspector_id = auth.uid() or public.is_manager(auth.uid()));
create policy "staff write results" on public.inspection_results for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update results" on public.inspection_results for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff insert incidents" on public.incidents for insert to authenticated with check (public.is_staff(auth.uid()) and reporter_id = auth.uid());
create policy "update incidents" on public.incidents for update to authenticated using (assignee_id = auth.uid() or reporter_id = auth.uid() or public.is_manager(auth.uid()));
create policy "admin delete incidents" on public.incidents for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "staff insert logs" on public.incident_logs for insert to authenticated with check (public.is_staff(auth.uid()) and actor_id = auth.uid());
create policy "staff insert discounts" on public.discounts for insert to authenticated with check (public.is_staff(auth.uid()) and recorded_by = auth.uid());
create policy "manager delete discounts" on public.discounts for delete to authenticated using (public.is_manager(auth.uid()));
create policy "admin write hourly" on public.parking_hourly for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.touch_incident() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now();
  if new.assignee_id is not null and old.assignee_id is distinct from new.assignee_id and new.assigned_at is null then new.assigned_at = now(); end if;
  if new.status = 'in_progress' and new.started_at is null then new.started_at = now(); end if;
  if new.status in ('resolved','closed') and new.resolved_at is null then new.resolved_at = now(); end if;
  return new; end $$;
create trigger trg_touch_incident before update on public.incidents for each row execute function public.touch_incident();

-- Seed data
insert into public.sites(code,name,direction) values
(1,'จุด 1','ทางเข้า'),(2,'จุด 2','ทางเข้า'),(3,'จุด 3','ทางเข้า'),(4,'จุด 4','ทางออก'),(5,'จุด 5','ทางออก'),(6,'จุด 6','ทางออก'),(7,'จุด 7','ทางเข้า-ออก');

insert into public.equipment(site_id,name,type,asset_code,sort_order)
select s.id, e.name, e.type, 'S' || s.code || '-' || e.short, e.ord from public.sites s
cross join (values ('LPR Camera','lpr','LPR',1),('Barrier','barrier','BAR',2),('Loop Sensor','loop','LOOP',3),('Kiosk จ่ายบัตร/ชำระเงิน','kiosk','KIO',4),('Intercom','intercom','INT',5),('CCTV','cctv','CCTV',6),('Network Switch','network','NET',7),('Power Supply','power','PWR',8)) as e(name,type,short,ord);

insert into public.checklist_templates(equipment_type,item,sort_order) values
('lpr','ภาพชัดเจน อ่านป้ายทะเบียนได้',1),('lpr','เชื่อมต่อระบบได้',2),('lpr','มุมกล้องถูกต้อง',3),('lpr','ไม่มีสิ่งกีดขวาง',4),('lpr','ทำความสะอาดเลนส์แล้ว',5),
('barrier','ไม้กั้นขึ้น-ลงปกติ',1),('barrier','ไม่มีเสียงผิดปกติ',2),('barrier','ระบบกันชนทำงาน',3),('barrier','สภาพไม้กั้นสมบูรณ์',4),
('loop','ตรวจจับรถได้ปกติ',1),('loop','ไม่มีสัญญาณหลอก',2),
('kiosk','จ่ายบัตร/QR ได้ปกติ',1),('kiosk','รับชำระเงินได้ (QR/เงินสด)',2),('kiosk','หน้าจอทำงานปกติ',3),('kiosk','กระดาษ/บัตรเพียงพอ',4),('kiosk','บันทึกส่วนลดได้',5),
('intercom','โทรออกห้องควบคุมได้',1),('intercom','เสียงชัดเจน',2),
('cctv','ภาพแสดงผลปกติ',1),('cctv','บันทึกภาพได้',2),
('network','ไฟสถานะปกติ',1),('network','เชื่อมต่อ Server ได้',2),
('power','แรงดันไฟปกติ',1),('power','UPS พร้อมใช้งาน',2);

insert into public.parking_hourly(site_id,stat_date,hour,entries,exits,revenue,pay_qr,pay_kiosk,pay_exit)
select s.id, d::date, h,
  e, x, x*15, round(x*15*0.68), round(x*15*0.27), round(x*15*0.05)
from public.sites s
cross join generate_series(current_date - 30, current_date, interval '1 day') d
cross join generate_series(0,23) h
cross join lateral (select
  greatest(1, round((case when s.code=7 then 2.4 else 1 end) * (10 + 70*exp(-power((h-14)/4.5,2)) + random()*12)))::int as e,
  greatest(1, round((case when s.code=7 then 2.4 else 1 end) * (9 + 68*exp(-power((h-15)/4.5,2)) + random()*12)))::int as x) v;

insert into public.incidents(site_id,equipment_id,title,category,severity,status,description,created_at)
select s.id, eq.id, v.title, v.cat, v.sev::severity_level, v.st::incident_status, v.title, now() - (v.hrs || ' hours')::interval
from (values (3,'lpr','LPR ไม่อ่านป้าย','ไม่อ่านป้ายทะเบียน','critical','open',2),
             (5,'kiosk','Kiosk ไม่จ่ายตั๋ว','เครื่องไม่ตอบสนอง','high','in_progress',3),
             (2,'barrier','ไม้กั้นไม่ยก','ขึ้นไม่สุด/ลงไม่สุด','high','open',5),
             (4,'intercom','Intercom ไม่มีเสียง','เสียงผิดปกติ','medium','resolved',30),
             (6,'network','Network สัญญาณขาด','เชื่อมต่อไม่ได้','low','closed',50)) v(code,typ,title,cat,sev,st,hrs)
join public.sites s on s.code=v.code join public.equipment eq on eq.site_id=s.id and eq.type=v.typ;
update public.incidents set resolved_at = created_at + interval '75 minutes', root_cause='สายสัญญาณหลวม', resolution='เปลี่ยนสายและทดสอบแล้ว' where status in ('resolved','closed');
update public.incidents set started_at = created_at + interval '20 minutes' where status <> 'open';
