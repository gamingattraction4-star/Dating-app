package com.sparkmatch.config;

import com.sparkmatch.chat.model.Conversation;
import com.sparkmatch.chat.model.Message;
import com.sparkmatch.chat.repository.ConversationRepository;
import com.sparkmatch.chat.repository.MessageRepository;
import com.sparkmatch.icebreaker.model.IceBreakerPrompt;
import com.sparkmatch.icebreaker.model.UserPrompt;
import com.sparkmatch.icebreaker.repository.IceBreakerPromptRepository;
import com.sparkmatch.icebreaker.repository.UserPromptRepository;
import com.sparkmatch.swipe.model.Match;
import com.sparkmatch.swipe.model.Swipe;
import com.sparkmatch.swipe.repository.MatchRepository;
import com.sparkmatch.swipe.repository.SwipeRepository;
import com.sparkmatch.user.model.*;
import com.sparkmatch.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Seeds the database with realistic demo data on first launch so the app is
 * immediately usable (Discover deck, matches, and chats are populated).
 *
 * Safety:
 *  - Idempotent: only runs when the users table is empty.
 *  - Toggleable: disable in production with `app.seed.enabled=false`.
 *
 * Demo login: any seeded email with password "Password123".
 * The primary demo account is {@code arjun@demo.com}.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_PASSWORD = "Password123";

    // Bangalore city centre — all demo users are scattered within a few km so
    // distance-based discovery returns results out of the box.
    private static final double BASE_LAT = 12.9716;
    private static final double BASE_LNG = 77.5946;

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPhotoRepository photoRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final InterestRepository interestRepository;
    private final UserInterestRepository userInterestRepository;
    private final IceBreakerPromptRepository promptRepository;
    private final UserPromptRepository userPromptRepository;
    private final SwipeRepository swipeRepository;
    private final MatchRepository matchRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // Reference data (interests/prompts) is always ensured — cheap and idempotent.
        ensureInterests();
        ensurePrompts();

        // Demo users are seeded only once. Key off the canonical demo account so a
        // few stray test signups on a fresh cloud DB don't block seeding.
        if (userRepository.existsByEmail("arjun@demo.com")) {
            log.info("⏩ Demo users already seeded — skipping.");
            return;
        }
        log.info("🌱 Seeding demo data...");

        List<Interest> interests = interestRepository.findAll();
        List<IceBreakerPrompt> prompts = promptRepository.findAll();
        if (interests.isEmpty() || prompts.isEmpty()) {
            log.warn("Reference data missing and could not be created — skipping demo seed.");
            return;
        }

        // ---- The primary demo user (the person who logs in) -----------------
        User me = createUser("arjun@demo.com", "+919800000001", true, true, User.UserStatus.ACTIVE);
        createProfile(me, "Arjun", 27, UserProfile.Gender.MALE,
                "Coffee-fuelled developer who makes apps and questionable playlists. Let's get lost in a new city. ☕️💻",
                "Mobile Developer", "TechCorp", "IIT Bombay", "Bangalore",
                0.0, 0.0, UserProfile.LookingFor.RELATIONSHIP, 95);
        createPreferences(me, UserPreferences.GenderPreference.EVERYONE, 22, 38, 80, true);
        addPhotos(me, "men", 32, 2);
        addInterests(me, interests, "Coffee", "Travel", "Tech", "Music", "Fitness");
        addPrompts(me, prompts, 2);

        // ---- Candidate profiles for the Discover deck -----------------------
        List<DemoProfile> demos = demoProfiles();
        List<User> created = new ArrayList<>();
        for (DemoProfile d : demos) {
            User u = createUser(d.email, d.phone, d.verified, d.premium, User.UserStatus.ACTIVE);
            double[] loc = jitter(d.latOffset, d.lngOffset);
            createProfile(u, d.name, d.age, d.gender, d.bio, d.job, d.company, d.school, d.city,
                    loc[0], loc[1], d.lookingFor, 90);
            createPreferences(u, UserPreferences.GenderPreference.EVERYONE, 21, 40, 100, true);
            addPhotos(u, d.photoGender, d.photoSeed, d.photoCount);
            addInterests(u, interests, d.interests);
            addPrompts(u, prompts, 2);
            created.add(u);
        }

        // ---- Some of them already like "me" (powers Who-Liked-You) ----------
        // Indexes 0,1,3,5,8 like me but I haven't swiped them yet.
        for (int idx : new int[]{0, 1, 3, 5, 8}) {
            like(created.get(idx), me);
        }

        // ---- Pre-built matches + conversations so chat isn't empty ----------
        // I matched with #2 (Meera) and #6 (Diya): mutual likes -> match -> chat.
        Match m1 = mutualMatch(me, created.get(2));
        Conversation c1 = conversationFor(m1, false);
        seedMessages(c1, me, created.get(2), new String[][]{
                {"them", "Heyy! Your baking pics are unreal 🍰"},
                {"me", "Haha thank you! What's your go-to cafe order?"},
                {"them", "Flat white, always. Coffee snob, sorry not sorry ☕️"},
                {"me", "That's a green flag. Free this weekend?"},
        });

        Match m2 = mutualMatch(me, created.get(6));
        Conversation c2 = conversationFor(m2, false);
        seedMessages(c2, me, created.get(6), new String[][]{
                {"them", "We HAVE to swap book recommendations 📚"},
                {"me", "Currently re-reading a sci-fi classic. You?"},
        });

        log.info("✅ Seed complete: {} users, {} matches. Demo login: arjun@demo.com / {}",
                userRepository.count(), matchRepository.count(), DEMO_PASSWORD);
    }

    // ==================== Reference data ====================

    /** Seeds the interest catalogue if empty (mirrors schema.sql). */
    private void ensureInterests() {
        if (interestRepository.count() > 0) return;
        String[][] data = {
            {"Travel", "Lifestyle", "✈️"}, {"Music", "Entertainment", "🎵"},
            {"Cooking", "Lifestyle", "🍳"}, {"Fitness", "Health", "💪"},
            {"Photography", "Creative", "📷"}, {"Reading", "Education", "📚"},
            {"Gaming", "Entertainment", "🎮"}, {"Movies", "Entertainment", "🎬"},
            {"Yoga", "Health", "🧘"}, {"Dancing", "Entertainment", "💃"},
            {"Art", "Creative", "🎨"}, {"Hiking", "Outdoor", "🥾"},
            {"Coffee", "Lifestyle", "☕"}, {"Wine", "Lifestyle", "🍷"},
            {"Dogs", "Pets", "🐕"}, {"Cats", "Pets", "🐈"},
            {"Tech", "Career", "💻"}, {"Fashion", "Lifestyle", "👗"},
            {"Food", "Lifestyle", "🍕"}, {"Sports", "Health", "⚽"},
            {"Surfing", "Outdoor", "🏄"}, {"Baking", "Lifestyle", "🧁"},
        };
        for (String[] d : data) {
            interestRepository.save(Interest.builder()
                    .name(d[0]).category(d[1]).icon(d[2]).build());
        }
        log.info("Seeded {} interests", data.length);
    }

    /** Seeds ice-breaker prompts if empty (mirrors schema.sql). */
    private void ensurePrompts() {
        if (promptRepository.count() > 0) return;
        String[][] data = {
            {"Two truths and a lie...", "Fun"},
            {"My most controversial opinion is...", "Deep"},
            {"The way to win me over is...", "Romantic"},
            {"A perfect first date would be...", "Romantic"},
            {"I'm looking for someone who...", "Serious"},
            {"My simple pleasures are...", "Casual"},
        };
        for (String[] d : data) {
            promptRepository.save(IceBreakerPrompt.builder()
                    .promptText(d[0]).category(d[1]).isSystem(true).build());
        }
        log.info("Seeded {} prompts", data.length);
    }

    // ==================== Builders ====================

    private User createUser(String email, String phone, boolean verified, boolean premium, User.UserStatus status) {
        return userRepository.save(User.builder()
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .authProvider(User.AuthProvider.LOCAL)
                .role(User.UserRole.USER)
                .status(status)
                .isVerified(verified)
                .isPremium(premium)
                .lastActiveAt(LocalDateTime.now())
                .build());
    }

    private UserProfile createProfile(User user, String name, int age, UserProfile.Gender gender,
                                      String bio, String job, String company, String school, String city,
                                      double lat, double lng, UserProfile.LookingFor lookingFor, int completePct) {
        return profileRepository.save(UserProfile.builder()
                .user(user)
                .displayName(name)
                .birthdate(LocalDate.now().minusYears(age).minusDays(120))
                .gender(gender)
                .bio(bio)
                .jobTitle(job)
                .company(company)
                .school(school)
                .city(city)
                .latitude(lat == 0.0 ? BASE_LAT : lat)
                .longitude(lng == 0.0 ? BASE_LNG : lng)
                .drinking(UserProfile.LifestyleChoice.SOMETIMES)
                .smoking(UserProfile.LifestyleChoice.NEVER)
                .lookingFor(lookingFor)
                .profileCompletePct(completePct)
                .build());
    }

    private void createPreferences(User user, UserPreferences.GenderPreference pref,
                                   int minAge, int maxAge, int maxDistance, boolean global) {
        preferencesRepository.save(UserPreferences.builder()
                .user(user)
                .genderPreference(pref)
                .minAge(minAge)
                .maxAge(maxAge)
                .maxDistanceKm(maxDistance)
                .showMeOnApp(true)
                .globalMode(global)
                .build());
    }

    private void addPhotos(User user, String genderPath, int seed, int count) {
        for (int i = 0; i < count; i++) {
            // First photo: a real portrait. Extra photos: stable lifestyle shots.
            String url = i == 0
                    ? "https://randomuser.me/api/portraits/" + genderPath + "/" + ((seed + i) % 99) + ".jpg"
                    : "https://picsum.photos/seed/" + user.getId() + "-" + i + "/800/1100";
            photoRepository.save(UserPhoto.builder()
                    .user(user)
                    .photoUrl(url)
                    .thumbnailUrl(url)
                    .orderIndex(i)
                    .isPrimary(i == 0)
                    .isVerified(i == 0 && Boolean.TRUE.equals(user.getIsVerified()))
                    .build());
        }
    }

    private void addInterests(User user, List<Interest> all, String... names) {
        List<String> wanted = Arrays.asList(names);
        all.stream()
                .filter(i -> wanted.contains(i.getName()))
                .forEach(i -> userInterestRepository.save(UserInterest.builder()
                        .user(user).interest(i).build()));
    }

    private void addPrompts(User user, List<IceBreakerPrompt> prompts, int count) {
        String[] answers = {
                "Coffee that turns into a 3-hour walk.",
                "Someone who texts back and actually shows up.",
                "Bring me a good book and a flat white.",
                "I've met a tiger, run a marathon, and can cook (one is a lie).",
                "Rain, filter coffee, and zero plans.",
        };
        for (int i = 0; i < count && i < prompts.size(); i++) {
            userPromptRepository.save(UserPrompt.builder()
                    .user(user)
                    .prompt(prompts.get(i))
                    .answer(answers[i % answers.length])
                    .orderIndex(i)
                    .build());
        }
    }

    private void like(User swiper, User swiped) {
        swipeRepository.save(Swipe.builder()
                .swiper(swiper).swiped(swiped).swipeType(Swipe.SwipeType.LIKE).build());
    }

    /** Records mutual likes and creates the canonical (userOne.id < userTwo.id) match. */
    private Match mutualMatch(User a, User b) {
        like(a, b);
        like(b, a);
        User one = a.getId() < b.getId() ? a : b;
        User two = a.getId() < b.getId() ? b : a;
        return matchRepository.save(Match.builder()
                .userOne(one).userTwo(two).isActive(true).matchedAt(LocalDateTime.now()).build());
    }

    private Conversation conversationFor(Match match, boolean femaleInitiated) {
        return conversationRepository.save(Conversation.builder()
                .match(match)
                .isActive(true)
                .femaleInitiated(femaleInitiated)
                .build());
    }

    /** rows: [{"me"|"them", text}, ...]. "them" = the other user in the match. */
    private void seedMessages(Conversation convo, User me, User them, String[][] rows) {
        Message last = null;
        for (String[] row : rows) {
            User sender = row[0].equals("me") ? me : them;
            last = messageRepository.save(Message.builder()
                    .conversation(convo)
                    .sender(sender)
                    .content(row[1])
                    .messageType(Message.MessageType.TEXT)
                    .isRead(row[0].equals("me")) // their latest stays unread for the badge
                    .build());
        }
        if (last != null) {
            convo.setLastMessageAt(LocalDateTime.now());
            convo.setLastMessagePreview(last.getContent());
            conversationRepository.save(convo);
        }
    }

    private double[] jitter(double latOffset, double lngOffset) {
        return new double[]{BASE_LAT + latOffset, BASE_LNG + lngOffset};
    }

    // ==================== Demo dataset ====================

    private record DemoProfile(
            String email, String phone, String name, int age, UserProfile.Gender gender,
            String bio, String job, String company, String school, String city,
            double latOffset, double lngOffset, UserProfile.LookingFor lookingFor,
            boolean verified, boolean premium, String photoGender, int photoSeed, int photoCount,
            String[] interests
    ) {}

    private List<DemoProfile> demoProfiles() {
        return List.of(
            new DemoProfile("aanya@demo.com", "+919800000002", "Aanya", 26, UserProfile.Gender.FEMALE,
                "Sunsets, street food and spontaneous road trips. Tell me your favourite song 🎧",
                "Product Designer", "Spotify", "NID Ahmedabad", "Bangalore",
                0.01, 0.012, UserProfile.LookingFor.RELATIONSHIP, true, false, "women", 45, 3,
                new String[]{"Travel", "Music", "Food", "Photography"}),
            new DemoProfile("sara@demo.com", "+919800000003", "Sara", 24, UserProfile.Gender.FEMALE,
                "Yoga in the morning, tacos at midnight 🌮 Dog mom to a dramatic golden retriever.",
                "Yoga Instructor", "Cult.fit", "Delhi University", "Bangalore",
                -0.02, 0.015, UserProfile.LookingFor.CASUAL, true, false, "women", 5, 3,
                new String[]{"Yoga", "Dogs", "Food", "Wine"}),
            new DemoProfile("meera@demo.com", "+919800000004", "Meera", 28, UserProfile.Gender.FEMALE,
                "Architect by day, amateur baker by night 🍰 I'll judge you (lovingly) by your playlist.",
                "Architect", "Studio Lotus", "CEPT University", "Bangalore",
                0.03, -0.02, UserProfile.LookingFor.RELATIONSHIP, false, false, "women", 20, 3,
                new String[]{"Art", "Cooking", "Coffee", "Reading"}),
            new DemoProfile("ishita@demo.com", "+919800000005", "Ishita", 27, UserProfile.Gender.FEMALE,
                "Marketing nerd, weekend trekker, full-time chai enthusiast ☕️⛰️",
                "Growth Lead", "Razorpay", "IIM Bangalore", "Bangalore",
                0.04, 0.03, UserProfile.LookingFor.RELATIONSHIP, true, false, "women", 16, 3,
                new String[]{"Hiking", "Coffee", "Tech", "Travel"}),
            new DemoProfile("riya@demo.com", "+919800000006", "Riya", 23, UserProfile.Gender.FEMALE,
                "Painting tiny things, watching big films 🎬 Lose track of time with me.",
                "Illustrator", "Freelance", "Sir JJ School of Art", "Bangalore",
                -0.01, -0.01, UserProfile.LookingFor.FRIENDSHIP, false, false, "women", 47, 3,
                new String[]{"Art", "Movies", "Cats", "Music"}),
            new DemoProfile("tara@demo.com", "+919800000007", "Tara", 29, UserProfile.Gender.FEMALE,
                "Doctor with a dangerous love for dance floors 💃 Send memes, not 'hey'.",
                "Resident Doctor", "Manipal Hospital", "AIIMS Delhi", "Bangalore",
                0.02, 0.04, UserProfile.LookingFor.RELATIONSHIP, true, true, "women", 24, 3,
                new String[]{"Dancing", "Music", "Fitness", "Wine"}),
            new DemoProfile("diya@demo.com", "+919800000008", "Diya", 26, UserProfile.Gender.FEMALE,
                "Reader of too many books, drinker of too much coffee 📚 Swap recommendations?",
                "Editor", "Penguin", "Jadavpur University", "Bangalore",
                -0.03, 0.02, UserProfile.LookingFor.RELATIONSHIP, true, false, "women", 48, 3,
                new String[]{"Reading", "Coffee", "Art", "Movies"}),
            new DemoProfile("nyla@demo.com", "+919800000009", "Nyla", 25, UserProfile.Gender.FEMALE,
                "Surf, sand and a good sourdough 🏄‍♀️ Always chasing the next wave (and brunch).",
                "Content Creator", "Self", "Symbiosis Pune", "Bangalore",
                0.05, -0.03, UserProfile.LookingFor.CASUAL, false, false, "women", 26, 3,
                new String[]{"Surfing", "Food", "Cooking", "Travel"}),
            new DemoProfile("kabir@demo.com", "+919800000010", "Kabir", 28, UserProfile.Gender.MALE,
                "Climbing walls and writing code. Will plan the whole trip if you say yes ✈️",
                "Software Engineer", "Google", "BITS Pilani", "Bangalore",
                0.015, 0.025, UserProfile.LookingFor.RELATIONSHIP, true, false, "men", 12, 3,
                new String[]{"Fitness", "Travel", "Tech", "Coffee"}),
            new DemoProfile("avni@demo.com", "+919800000011", "Avni", 27, UserProfile.Gender.FEMALE,
                "Gamer girl, gym rat, ramen connoisseur 🍜 Co-op or competitive, I'm in.",
                "Game Designer", "Ubisoft", "DSK Supinfocom", "Bangalore",
                -0.025, -0.02, UserProfile.LookingFor.CASUAL, false, false, "women", 31, 3,
                new String[]{"Gaming", "Fitness", "Food", "Movies"}),
            new DemoProfile("zoya@demo.com", "+919800000012", "Zoya", 25, UserProfile.Gender.FEMALE,
                "Plant mom, playlist curator, sucker for old bookstores 🌿 Let's wander.",
                "UX Researcher", "Flipkart", "Srishti", "Bangalore",
                0.018, -0.015, UserProfile.LookingFor.RELATIONSHIP, true, false, "women", 9, 3,
                new String[]{"Music", "Reading", "Coffee", "Photography"}),
            new DemoProfile("kabir2@demo.com", "+919800000013", "Rohan", 30, UserProfile.Gender.MALE,
                "Chef who travels to eat. I'll cook, you bring the wine 🍷",
                "Chef", "Toit", "IHM", "Bangalore",
                0.022, 0.018, UserProfile.LookingFor.RELATIONSHIP, false, false, "men", 51, 3,
                new String[]{"Cooking", "Wine", "Travel", "Food"})
        );
    }
}
