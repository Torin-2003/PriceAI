create index if not exists api_transit_availability_samples_checked_time_idx
  on api_transit_availability_samples(checked_at desc, station_id)
  include (scope, standard_model, group_name, ok, source_type);
