package com.sparkmatch.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Makes the app deploy-friendly on Railway / Render / Heroku.
 *
 * Those platforms expose the database as a single connection string env var
 * (e.g. {@code DATABASE_URL} or {@code MYSQL_URL}) in the form:
 *
 *   mysql://user:password@host:port/dbname
 *
 * Spring Boot, however, needs a {@code jdbc:mysql://...} URL plus separate
 * username/password. This post-processor detects that single var (if present
 * and not already a jdbc URL) and splits it into the three Spring properties,
 * BEFORE the datasource is created. This way the user only has to reference one
 * variable on the hosting platform instead of wiring three by hand.
 *
 * If {@code spring.datasource.url} is already a proper {@code jdbc:} URL (e.g.
 * set manually), this does nothing.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String[] CANDIDATE_VARS = {
            "DATABASE_URL", "MYSQL_URL", "JAWSDB_URL", "CLEARDB_DATABASE_URL"
    };

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication application) {
        // If a valid jdbc URL is already configured, leave everything alone.
        String existing = env.getProperty("spring.datasource.url");
        if (existing != null && existing.startsWith("jdbc:")) {
            return;
        }

        String raw = firstNonBlank(env);
        if (raw == null) {
            return;
        }

        try {
            // Normalize: some platforms use "jdbc:mysql://..." already; strip the jdbc: to parse.
            String parseable = raw.startsWith("jdbc:") ? raw.substring(5) : raw;
            URI uri = new URI(parseable);

            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            boolean isPostgres = scheme.startsWith("postgres");

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : (isPostgres ? 5432 : 3306);
            String db = uri.getPath() != null && uri.getPath().length() > 1
                    ? uri.getPath().substring(1) : "railway";

            String user = null;
            String pass = null;
            String userInfo = uri.getUserInfo();
            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                user = parts[0];
                pass = parts[1];
            }

            if (host == null) {
                return; // Couldn't parse; let the normal config path handle it.
            }

            // sslmode=prefer: uses SSL when the server supports it (Render/managed),
            // falls back to plain when it doesn't (local Docker) — works everywhere.
            String sslMode = env.getProperty("DB_SSLMODE", "prefer");
            String jdbcUrl = isPostgres
                    ? String.format("jdbc:postgresql://%s:%d/%s?sslmode=%s", host, port, db, sslMode)
                    : String.format("jdbc:mysql://%s:%d/%s?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC", host, port, db);

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", jdbcUrl);
            if (user != null) props.put("spring.datasource.username", user);
            if (pass != null) props.put("spring.datasource.password", pass);

            // Highest precedence so it wins over the unresolved ${...} placeholders.
            env.getPropertySources().addFirst(
                    new MapPropertySource("railwayDatabaseUrl", props));

            System.out.println("[DatabaseUrlEnvironmentPostProcessor] Parsed database connection from a single URL env var -> " + jdbcUrl);
        } catch (Exception e) {
            // Non-fatal: fall back to whatever is configured in application*.yml.
            System.out.println("[DatabaseUrlEnvironmentPostProcessor] Could not parse database URL: " + e.getMessage());
        }
    }

    private String firstNonBlank(ConfigurableEnvironment env) {
        for (String var : CANDIDATE_VARS) {
            String v = env.getProperty(var);
            if (v != null && !v.isBlank() && v.contains("://")) {
                return v.trim();
            }
        }
        return null;
    }
}
