SELECT
    owner,
    COUNT(*) as job_count,
    ROUND(SUM(duration) / 60000.0, 2) as total_minutes
FROM usage_telemetry
-- -- filter for on premise only
-- WHERE owner NOT LIKE '%dev.azure.com%' AND owner NOT LIKE '%visualstudio.com%'
GROUP BY owner
ORDER BY total_minutes DESC;
