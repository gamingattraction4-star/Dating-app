-- =========================================================
-- SparkMatch Dating App — MySQL Database Schema
-- Version: 1.0.0
-- Engine: InnoDB (for FK support & row-level locking)
-- Charset: utf8mb4 (full Unicode/emoji support)
-- =========================================================

CREATE DATABASE IF NOT EXISTS sparkmatch
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sparkmatch;

-- =========================================================
-- 1. USERS TABLE — Core authentication & account data
-- =========================================================
CREATE TABLE users (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255)    UNIQUE,
    phone           VARCHAR(20)     UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    auth_provider   ENUM('LOCAL', 'GOOGLE', 'APPLE') DEFAULT 'LOCAL',
    provider_id     VARCHAR(255)    NULL,
    role            ENUM('USER', 'ADMIN', 'MODERATOR') DEFAULT 'USER',
    status          ENUM('ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED', 'PENDING_VERIFICATION') DEFAULT 'PENDING_VERIFICATION',
    is_verified     BOOLEAN         DEFAULT FALSE,
    is_premium      BOOLEAN         DEFAULT FALSE,
    last_active_at  TIMESTAMP       NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,

    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone),
    INDEX idx_users_status (status),
    INDEX idx_users_last_active (last_active_at),
    INDEX idx_users_provider (auth_provider, provider_id)
) ENGINE=InnoDB;

-- =========================================================
-- 2. USER PROFILES — Extended profile information
-- =========================================================
CREATE TABLE user_profiles (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    display_name    VARCHAR(100)    NOT NULL,
    birthdate       DATE            NOT NULL,
    gender          ENUM('MALE', 'FEMALE', 'NON_BINARY', 'OTHER') NOT NULL,
    bio             TEXT            NULL,
    job_title       VARCHAR(150)    NULL,
    company         VARCHAR(150)    NULL,
    school          VARCHAR(150)    NULL,
    city            VARCHAR(100)    NULL,
    latitude        DECIMAL(10, 8)  NULL,
    longitude       DECIMAL(11, 8)  NULL,
    location        POINT           NULL,
    height_cm       SMALLINT        NULL,
    drinking        ENUM('NEVER', 'SOMETIMES', 'OFTEN') NULL,
    smoking         ENUM('NEVER', 'SOMETIMES', 'OFTEN') NULL,
    looking_for     ENUM('RELATIONSHIP', 'CASUAL', 'FRIENDSHIP', 'NOT_SURE') NULL,
    profile_complete_pct TINYINT    DEFAULT 0,
    boost_end_time  TIMESTAMP       NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profiles_gender (gender),
    INDEX idx_profiles_city (city),
    INDEX idx_profiles_location (latitude, longitude)
) ENGINE=InnoDB;

-- =========================================================
-- 3. USER PHOTOS — Profile images (max 6)
-- =========================================================
CREATE TABLE user_photos (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    photo_url       VARCHAR(500)    NOT NULL,
    thumbnail_url   VARCHAR(500)    NULL,
    order_index     TINYINT         NOT NULL DEFAULT 0,
    is_primary      BOOLEAN         DEFAULT FALSE,
    is_verified     BOOLEAN         DEFAULT FALSE,
    width           INT             NULL,
    height          INT             NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_photos_user (user_id, order_index),
    INDEX idx_photos_primary (user_id, is_primary)
) ENGINE=InnoDB;

-- =========================================================
-- 4. USER INTERESTS — Interest tags
-- =========================================================
CREATE TABLE interests (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL UNIQUE,
    category        VARCHAR(50)     NULL,
    icon            VARCHAR(50)     NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_interests (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    interest_id     BIGINT          NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_interest (user_id, interest_id),
    INDEX idx_user_interests_user (user_id)
) ENGINE=InnoDB;

-- =========================================================
-- 5. USER PREFERENCES — Match filters
-- =========================================================
CREATE TABLE user_preferences (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    min_age         TINYINT         DEFAULT 18,
    max_age         TINYINT         DEFAULT 50,
    max_distance_km INT             DEFAULT 50,
    gender_preference ENUM('MALE', 'FEMALE', 'EVERYONE') DEFAULT 'EVERYONE',
    show_me_on_app  BOOLEAN         DEFAULT TRUE,
    global_mode     BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 6. SWIPES — Like/Dislike/SuperLike actions
-- =========================================================
CREATE TABLE swipes (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    swiper_id       BIGINT          NOT NULL,
    swiped_id       BIGINT          NOT NULL,
    swipe_type      ENUM('LIKE', 'DISLIKE', 'SUPER_LIKE') NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (swiper_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (swiped_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_swipe_pair (swiper_id, swiped_id),
    INDEX idx_swipes_swiped (swiped_id, swipe_type),
    INDEX idx_swipes_created (created_at)
) ENGINE=InnoDB;

-- =========================================================
-- 7. MATCHES — Mutual likes
-- =========================================================
CREATE TABLE matches (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_one_id     BIGINT          NOT NULL,
    user_two_id     BIGINT          NOT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    matched_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    unmatched_at    TIMESTAMP       NULL,

    FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_match_pair (user_one_id, user_two_id),
    INDEX idx_matches_user_one (user_one_id, is_active),
    INDEX idx_matches_user_two (user_two_id, is_active),
    INDEX idx_matches_active (is_active, matched_at),
    -- Ensure user_one_id < user_two_id to prevent duplicate records
    CHECK (user_one_id < user_two_id)
) ENGINE=InnoDB;

-- =========================================================
-- 8. CONVERSATIONS — Chat threads per match
-- =========================================================
CREATE TABLE conversations (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    match_id        BIGINT          NOT NULL UNIQUE,
    last_message_at TIMESTAMP       NULL,
    last_message_preview VARCHAR(255) NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    female_initiated BOOLEAN        DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    INDEX idx_conversations_active (is_active, last_message_at DESC)
) ENGINE=InnoDB;

-- =========================================================
-- 9. MESSAGES — Individual chat messages
-- =========================================================
CREATE TABLE messages (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT          NOT NULL,
    sender_id       BIGINT          NOT NULL,
    content         TEXT            NULL,
    message_type    ENUM('TEXT', 'IMAGE', 'VOICE', 'GIF', 'ICE_BREAKER') DEFAULT 'TEXT',
    media_url       VARCHAR(500)    NULL,
    is_read         BOOLEAN         DEFAULT FALSE,
    read_at         TIMESTAMP       NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP       NULL,

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation (conversation_id, created_at DESC),
    INDEX idx_messages_unread (conversation_id, is_read, created_at)
) ENGINE=InnoDB;

-- =========================================================
-- 10. ICE BREAKER PROMPTS — Conversation starters
-- =========================================================
CREATE TABLE ice_breaker_prompts (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    prompt_text     VARCHAR(500)    NOT NULL,
    category        VARCHAR(50)     NULL,
    is_system       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_prompts (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    prompt_id       BIGINT          NOT NULL,
    answer          TEXT            NOT NULL,
    order_index     TINYINT         DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (prompt_id) REFERENCES ice_breaker_prompts(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_prompt (user_id, prompt_id),
    INDEX idx_user_prompts_user (user_id, order_index)
) ENGINE=InnoDB;

-- =========================================================
-- 11. USER REPORTS — Safety & moderation
-- =========================================================
CREATE TABLE user_reports (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    reporter_id     BIGINT          NOT NULL,
    reported_id     BIGINT          NOT NULL,
    reason          ENUM('INAPPROPRIATE_PHOTOS', 'HARASSMENT', 'FAKE_PROFILE', 'SPAM', 'UNDERAGE', 'OFFENSIVE_BIO', 'OTHER') NOT NULL,
    description     TEXT            NULL,
    status          ENUM('PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED') DEFAULT 'PENDING',
    reviewed_by     BIGINT          NULL,
    reviewed_at     TIMESTAMP       NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reports_status (status, created_at),
    INDEX idx_reports_reported (reported_id)
) ENGINE=InnoDB;

-- =========================================================
-- 12. USER BLOCKS — Block list
-- =========================================================
CREATE TABLE user_blocks (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    blocker_id      BIGINT          NOT NULL,
    blocked_id      BIGINT          NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_block_pair (blocker_id, blocked_id),
    INDEX idx_blocks_blocker (blocker_id),
    INDEX idx_blocks_blocked (blocked_id)
) ENGINE=InnoDB;

-- =========================================================
-- 13. SUBSCRIPTIONS — Premium plans
-- =========================================================
CREATE TABLE subscription_plans (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    description     TEXT            NULL,
    price_cents     INT             NOT NULL,
    currency        VARCHAR(3)      DEFAULT 'USD',
    duration_days   INT             NOT NULL,
    features        JSON            NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    plan_id         BIGINT          NOT NULL,
    status          ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING') DEFAULT 'PENDING',
    starts_at       TIMESTAMP       NOT NULL,
    expires_at      TIMESTAMP       NOT NULL,
    payment_id      VARCHAR(255)    NULL,
    auto_renew      BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    INDEX idx_subscriptions_user (user_id, status),
    INDEX idx_subscriptions_expiry (expires_at, status)
) ENGINE=InnoDB;

-- =========================================================
-- 14. VERIFICATION REQUESTS — Blue tick system
-- =========================================================
CREATE TABLE verification_requests (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    selfie_url      VARCHAR(500)    NOT NULL,
    pose_type       VARCHAR(50)     NULL,
    status          ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    reviewed_by     BIGINT          NULL,
    rejection_reason TEXT           NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     TIMESTAMP       NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_verification_status (status, created_at)
) ENGINE=InnoDB;

-- =========================================================
-- 15. BOOST LOGS — Profile boost tracking
-- =========================================================
CREATE TABLE boost_logs (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    started_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP       NOT NULL,
    views_gained    INT             DEFAULT 0,
    likes_gained    INT             DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_boost_active (user_id, expires_at)
) ENGINE=InnoDB;

-- =========================================================
-- 16. OTP TABLE — OTP verification tracking
-- =========================================================
CREATE TABLE otp_codes (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    identifier      VARCHAR(255)    NOT NULL,
    otp_code        VARCHAR(6)      NOT NULL,
    purpose         ENUM('REGISTRATION', 'LOGIN', 'PASSWORD_RESET') DEFAULT 'REGISTRATION',
    attempts        TINYINT         DEFAULT 0,
    is_used         BOOLEAN         DEFAULT FALSE,
    expires_at      TIMESTAMP       NOT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_otp_identifier (identifier, is_used, expires_at)
) ENGINE=InnoDB;

-- =========================================================
-- 17. NOTIFICATIONS — In-app notifications
-- =========================================================
CREATE TABLE notifications (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    type            ENUM('MATCH', 'MESSAGE', 'LIKE', 'SUPER_LIKE', 'PROFILE_VIEW', 'SYSTEM') NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    body            TEXT            NOT NULL,
    action_type     VARCHAR(50)     NULL,
    action_id       BIGINT          NULL,
    is_read         BOOLEAN         DEFAULT FALSE,
    read_at         TIMESTAMP       NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB;

-- =========================================================
-- 18. NOTIFICATION PREFERENCES
-- =========================================================
CREATE TABLE notification_preferences (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    push_matches    BOOLEAN         DEFAULT TRUE,
    push_messages   BOOLEAN         DEFAULT TRUE,
    push_likes      BOOLEAN         DEFAULT TRUE,
    email_matches   BOOLEAN         DEFAULT FALSE,
    email_promotions BOOLEAN        DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- SEED DATA — Default interests
-- =========================================================
INSERT INTO interests (name, category, icon) VALUES
    ('Travel', 'Lifestyle', '✈️'),
    ('Music', 'Entertainment', '🎵'),
    ('Cooking', 'Lifestyle', '🍳'),
    ('Fitness', 'Health', '💪'),
    ('Photography', 'Creative', '📷'),
    ('Reading', 'Education', '📚'),
    ('Gaming', 'Entertainment', '🎮'),
    ('Movies', 'Entertainment', '🎬'),
    ('Yoga', 'Health', '🧘'),
    ('Dancing', 'Entertainment', '💃'),
    ('Art', 'Creative', '🎨'),
    ('Hiking', 'Outdoor', '🥾'),
    ('Coffee', 'Lifestyle', '☕'),
    ('Wine', 'Lifestyle', '🍷'),
    ('Dogs', 'Pets', '🐕'),
    ('Cats', 'Pets', '🐈'),
    ('Tech', 'Career', '💻'),
    ('Fashion', 'Lifestyle', '👗'),
    ('Food', 'Lifestyle', '🍕'),
    ('Sports', 'Health', '⚽'),
    ('Netflix', 'Entertainment', '📺'),
    ('Meditation', 'Health', '🧘‍♂️'),
    ('Writing', 'Creative', '✍️'),
    ('Volunteering', 'Social', '🤝'),
    ('Astronomy', 'Science', '🔭'),
    ('Board Games', 'Entertainment', '🎲'),
    ('Surfing', 'Outdoor', '🏄'),
    ('Cycling', 'Outdoor', '🚴'),
    ('Skincare', 'Lifestyle', '✨'),
    ('Anime', 'Entertainment', '🎌');

-- =========================================================
-- SEED DATA — Default ice breaker prompts
-- =========================================================
INSERT INTO ice_breaker_prompts (prompt_text, category) VALUES
    ('Two truths and a lie...', 'Fun'),
    ('My most controversial opinion is...', 'Deep'),
    ('The way to win me over is...', 'Romantic'),
    ('A perfect first date would be...', 'Romantic'),
    ('I''m looking for someone who...', 'Serious'),
    ('My simple pleasures are...', 'Casual'),
    ('I geek out on...', 'Fun'),
    ('The key to my heart is...', 'Romantic'),
    ('My go-to karaoke song is...', 'Fun'),
    ('I''m convinced that...', 'Deep'),
    ('After work you can find me...', 'Casual'),
    ('A life goal of mine is...', 'Serious'),
    ('I''ll know it''s love when...', 'Romantic'),
    ('My most irrational fear is...', 'Fun'),
    ('The one thing I''d love to learn is...', 'Serious');

-- =========================================================
-- SEED DATA — Default subscription plans
-- =========================================================
INSERT INTO subscription_plans (name, description, price_cents, currency, duration_days, features) VALUES
    ('SparkMatch Plus', 'Unlimited likes, 5 super likes/day, 1 boost/month', 999, 'USD', 30,
     '{"unlimited_likes": true, "super_likes_daily": 5, "boosts_monthly": 1, "see_who_liked": false, "undo_swipe": true, "travel_mode": false}'),
    ('SparkMatch Gold', 'See who likes you, unlimited everything, priority likes', 2999, 'USD', 30,
     '{"unlimited_likes": true, "super_likes_daily": -1, "boosts_monthly": 5, "see_who_liked": true, "undo_swipe": true, "travel_mode": true}'),
    ('SparkMatch Platinum', 'All Gold features + message before matching', 3999, 'USD', 30,
     '{"unlimited_likes": true, "super_likes_daily": -1, "boosts_monthly": -1, "see_who_liked": true, "undo_swipe": true, "travel_mode": true, "message_before_match": true}');
