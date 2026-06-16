-- Migration 001: Extensions
-- Must run first — pgcrypto provides gen_random_uuid(), pg_cron provides scheduled jobs.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;
