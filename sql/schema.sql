CREATE TABLE routes (
  route_id TEXT PRIMARY KEY,
  agency_id TEXT,
  route_short_name TEXT,
  route_long_name TEXT,
  route_type INTEGER,
  route_color TEXT
);

CREATE TABLE stops (
  stop_id TEXT PRIMARY KEY,
  stop_name TEXT,
  stop_lat REAL,
  stop_lon REAL
);

CREATE TABLE trips (
  trip_id TEXT PRIMARY KEY,
  route_id TEXT,
  service_id TEXT,
  trip_headsign TEXT,
  trip_short_name TEXT,
  direction_id INTEGER,
  shape_id TEXT
);

CREATE TABLE stop_times (
  trip_id TEXT,
  stop_sequence INTEGER,
  stop_id TEXT,
  arrival_time INTEGER,
  departure_time INTEGER,
  PRIMARY KEY (trip_id, stop_sequence)
);


