import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    await Future.delayed(const Duration(seconds: 2));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo with animation
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: VSColors.primaryGradient,
                boxShadow: [
                  BoxShadow(
                    color: VSColors.primary.withOpacity(0.5),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.favorite,
                  size: 60,
                  color: Colors.white,
                ),
              ),
            )
                .animate()
                .scale(duration: 600.ms, curve: Curves.elasticOut)
                .then()
                .scale(duration: 1.seconds, curve: Curves.easeInOut)
                .animate(onPlay: (controller) => controller.repeat(reverse: true)),
            const SizedBox(height: 32),
            // App name with animation
            Text(
              'VitalStep',
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: VSColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
            )
                .animate()
                .fadeIn(duration: 400.ms)
                .slideY(begin: 0.2, end: 0),
            const SizedBox(height: 8),
            // Subtitle with animation
            Text(
              'Palm Pressure Health Monitor',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: VSColors.textSecondary,
              ),
            )
                .animate()
                .fadeIn(duration: 400.ms, delay: 200.ms)
                .slideY(begin: 0.2, end: 0),
            const SizedBox(height: 48),
            // Loading indicator
            SizedBox(
              width: 40,
              height: 40,
              child: CircularProgressIndicator(
                valueColor:
                    AlwaysStoppedAnimation<Color>(VSColors.primary),
                strokeWidth: 3,
              ),
            )
                .animate()
                .fadeIn(duration: 400.ms, delay: 400.ms),
          ],
        ),
      ),
    );
  }
}
