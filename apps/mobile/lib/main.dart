import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'supabase_config.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/welcome_screen.dart';
import 'theme.dart';
import 'providers/theme_provider.dart';
import 'services/notification_service.dart';
import 'package:flutter_portal/flutter_portal.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await NotificationService().init();

    await Supabase.initialize(
      url: SupabaseConfig.url,
      anonKey: SupabaseConfig.anonKey,
    );

    runApp(
      const ProviderScope(
        child: PatchworkApp(),
      ),
    );
  } catch (e, stack) {
    runApp(
      MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Text(
                'CRASH LOG:\n$e\n\n$stack',
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PatchworkApp extends ConsumerWidget {
  const PatchworkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);

    return Portal(
      child: MaterialApp(
        title: 'Patchwork',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: themeMode,
        home: const InitialAuthCheck(),
      ),
    );
  }
}

class InitialAuthCheck extends StatefulWidget {
  const InitialAuthCheck({super.key});

  @override
  State<InitialAuthCheck> createState() => _InitialAuthCheckState();
}

class _InitialAuthCheckState extends State<InitialAuthCheck> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final session = Supabase.instance.client.auth.currentSession;
      if (session == null) {
        final prefs = await SharedPreferences.getInstance();
        final hasSeenWelcome = prefs.getBool('has_seen_welcome') ?? false;

        if (mounted) {
          if (hasSeenWelcome) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
          } else {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const WelcomeScreen()),
            );
          }
        }
      } else {
        // Check if onboarding is complete
        try {
          final user = session.user;
          final response = await Supabase.instance.client
              .from('users')
              .select('signup_completed_at')
              .eq('id', user.id)
              .maybeSingle();

          final bool hasCompletedOnboarding = response != null && response['signup_completed_at'] != null;

          if (mounted) {
            if (hasCompletedOnboarding) {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const HomeScreen()),
              );
            } else {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const OnboardingScreen()),
              );
            }
          }
        } catch (e) {
          // Fallback to home if error
          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const HomeScreen()),
            );
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0E0C16), // Match web dark loading screen
      body: Center(
        child: CircularProgressIndicator(color: context.themeColors.primary500),
      ),
    );
  }
}
