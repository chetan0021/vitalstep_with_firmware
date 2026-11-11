import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../theme/colors.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VSColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: VSColors.primaryGradient,
                      ),
                      child: const Icon(
                        Icons.favorite,
                        size: 40,
                        color: Colors.white,
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .scale(duration: 400.ms),
                    const SizedBox(height: 24),
                    Text(
                      'Welcome to VitalStep',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: 100.ms),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in to your account',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: VSColors.textSecondary,
                          ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: 200.ms),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Error message
              if (_error != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: VSColors.error.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: VSColors.error),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: VSColors.error),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(color: VSColors.error),
                        ),
                      ),
                    ],
                  ),
                )
                    .animate()
                    .slideX()
                    .fadeIn(),

              if (_error != null) const SizedBox(height: 24),

              // Email field
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  hintText: 'Enter your email',
                  prefixIcon: const Icon(Icons.email_outlined),
                  enabled: !_isLoading,
                ),
                keyboardType: TextInputType.emailAddress,
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 300.ms)
                  .slideX(begin: -0.2, end: 0),
              const SizedBox(height: 16),

              // Password field
              TextField(
                controller: _passwordController,
                decoration: InputDecoration(
                  hintText: 'Enter your password',
                  prefixIcon: const Icon(Icons.lock_outlined),
                  enabled: !_isLoading,
                ),
                obscureText: true,
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 400.ms)
                  .slideX(begin: -0.2, end: 0),
              const SizedBox(height: 32),

              // Sign in button
              ElevatedButton(
                onPressed: _isLoading ? null : _signIn,
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Sign In'),
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 500.ms)
                  .slideY(begin: 0.2, end: 0),
              const SizedBox(height: 16),

              // Sign up link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account? ",
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  TextButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            Navigator.of(context).pushReplacementNamed('/signup');
                          },
                    child: const Text(
                      'Sign Up',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: VSColors.primary,
                      ),
                    ),
                  ),
                ],
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 600.ms),

              const SizedBox(height: 24),

              // Test demo button
              OutlinedButton.icon(
                onPressed: _isLoading ? null : _demoMode,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Demo Mode (Test Data)'),
              )
                  .animate()
                  .fadeIn(duration: 400.ms, delay: 700.ms)
                  .scale(begin: 0.8),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _signIn() async {
    setState(() {
      _error = null;
      _isLoading = true;
    });

    try {
      // ignore: use_build_context_synchronously
      await context.read<AuthProvider>().signIn(
            _emailController.text.trim(),
            _passwordController.text,
          );
      // ignore: use_build_context_synchronously
      if (context.mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _demoMode() async {
    // Demo credentials
    _emailController.text = 'demo@vitalstep.com';
    _passwordController.text = 'Demo123!';
    await _signIn();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

// Import the AuthProvider from main.dart
// This is defined in main.dart as part of the app setup
